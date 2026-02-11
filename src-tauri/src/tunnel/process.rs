//! 隧道进程管理模块
//!
//! 本模块负责隧道进程的启动、停止、日志捕获和运行状态管理

use std::collections::HashMap;
use std::io::{BufRead, BufReader};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};

use crate::models::tunnel::TunnelProcess;

/// 进程管理器类型别名
///
/// 用于管理所有运行中的隧道进程，Key为隧道ID(proxy_id)，Value为隧道进程信息
pub type ProcessManager = Arc<Mutex<HashMap<i32, TunnelProcess>>>;

/// 启动隧道进程
///
/// # 参数
///
/// * `proxy_id` - 隧道ID
/// * `frp_token` - FRP认证令牌
/// * `process_manager` - 进程管理器
///
/// # 返回
///
/// 成功返回包含隧道ID的JSON响应，失败返回错误信息
pub async fn start_tunnel(
    proxy_id: i32,
    frp_token: &str,
    process_manager: &ProcessManager,
) -> Result<String, String> {
    // 检查是否已经有进程在运行
    {
        let manager = process_manager
            .lock()
            .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;
        if manager.contains_key(&proxy_id) {
            return Err("隧道已经在运行中".to_string());
        }
    }

    // 获取可执行文件同目录下bin文件夹中的mefrpc可执行文件路径
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {e}"))?;
    let exe_dir = exe_path.parent().ok_or("无法获取可执行文件目录")?;

    let mefrpc_path = exe_dir
        .join("bin")
        .join("mefrpc-x86_64-pc-windows-msvc.exe");

    if !mefrpc_path.exists() {
        return Err(format!("mefrpc.exe 不存在: {}", mefrpc_path.display()));
    }

    // 检查是否存在配置文件（按优先级：toml > json > yml > ini）
    let config_formats = ["toml", "json", "yml", "ini"];
    let mut config_file_path = None;

    for format in &config_formats {
        let config_path = exe_dir.join(format!("{proxy_id}.{format}"));
        if config_path.exists() {
            config_file_path = Some(config_path);
            break;
        }
    }

    // 启动mefrpc进程
    let mut command = Command::new(&mefrpc_path);

    if let Some(config_path) = config_file_path {
        // 使用配置文件启动：mefrpc -c {config}路径
        command.arg("-c").arg(&config_path);
    } else {
        // 使用传统参数启动
        command
            .arg("-t")
            .arg(frp_token)
            .arg("-p")
            .arg(proxy_id.to_string());
    }

    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    // 在Windows上隐藏命令行窗口
    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let mut child = command
        .spawn()
        .map_err(|e| format!("启动mefrpc进程失败: {e}"))?;

    // 创建日志存储
    let logs = Arc::new(Mutex::new(Vec::new()));
    let logs_clone = logs.clone();

    // 获取进程的 stdout 和 stderr
    let stdout = child.stdout.take().ok_or("无法获取进程stdout")?;
    let stderr = child.stderr.take().ok_or("无法获取进程stderr")?;

    // 启动异步任务读取 stdout（使用 spawn_blocking 避免阻塞主线程）
    let logs_stdout = logs.clone();
    tokio::task::spawn_blocking(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            if let Ok(mut logs) = logs_stdout.lock() {
                logs.push(line.to_string());
                // 限制日志数量，避免内存溢出
                if logs.len() > 1000 {
                    logs.remove(0);
                }
            }
        }
    });

    // 启动异步任务读取 stderr（使用 spawn_blocking 避免阻塞主线程）
    let logs_stderr = logs.clone();
    tokio::task::spawn_blocking(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            if let Ok(mut logs) = logs_stderr.lock() {
                logs.push(format!("[ERR] {line}"));
                // 限制日志数量，避免内存溢出
                if logs.len() > 1000 {
                    logs.remove(0);
                }
            }
        }
    });

    // 创建隧道进程信息
    let tunnel_process = TunnelProcess {
        proxy_id,
        child: Arc::new(Mutex::new(Some(child))),
        logs: logs_clone,
    };

    // 将进程添加到管理器
    {
        let mut manager = process_manager
            .lock()
            .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;
        manager.insert(proxy_id, tunnel_process);
    }

    Ok(format!(
        "{{\"code\": 200, \"message\": \"隧道启动成功\", \"data\": {{\"proxyId\": {proxy_id}}}}}"
    ))
}

/// 停止隧道进程
///
/// # 参数
///
/// * `proxy_id` - 隧道ID
/// * `process_manager` - 进程管理器
///
/// # 返回
///
/// 成功返回包含隧道ID的JSON响应，失败返回错误信息
pub async fn stop_tunnel(
    proxy_id: i32,
    process_manager: &ProcessManager,
) -> Result<String, String> {
    // 从进程管理器中获取并移除进程
    let tunnel_process = {
        let mut manager = process_manager
            .lock()
            .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;
        manager.remove(&proxy_id)
    };

    match tunnel_process {
        Some(process) => {
            // 尝试终止进程
            let mut child_guard = process
                .child
                .lock()
                .map_err(|e| format!("获取进程锁失败: {e}"))?;
            if let Some(mut child) = child_guard.take() {
                match child.kill() {
                    Ok(_) => {
                        // 等待进程结束
                        let _ = child.wait();
                        Ok(format!("{{\"code\": 200, \"message\": \"隧道停止成功\", \"data\": {{\"proxyId\": {proxy_id}}}}}"))
                    }
                    Err(e) => Err(format!("终止进程失败: {e}")),
                }
            } else {
                Err("进程已经被终止".to_string())
            }
        }
        None => Err("未找到运行中的隧道进程".to_string()),
    }
}

/// 获取隧道日志
///
/// # 参数
///
/// * `proxy_id` - 隧道ID
/// * `process_manager` - 进程管理器
///
/// # 返回
///
/// 成功返回日志行列表，失败返回错误信息
pub async fn get_tunnel_logs(
    proxy_id: i32,
    process_manager: &ProcessManager,
) -> Result<Vec<String>, String> {
    let manager = process_manager
        .lock()
        .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;

    match manager.get(&proxy_id) {
        Some(process) => {
            let logs = process
                .logs
                .lock()
                .map_err(|e| format!("获取日志锁失败: {e}"))?;
            Ok(logs.clone())
        }
        None => Err("未找到运行中的隧道进程".to_string()),
    }
}

/// 获取所有运行中的隧道ID列表
///
/// # 参数
///
/// * `process_manager` - 进程管理器
///
/// # 返回
///
/// 返回所有运行中的隧道ID列表
pub async fn get_running_tunnels(process_manager: &ProcessManager) -> Result<Vec<i32>, String> {
    let manager = process_manager
        .lock()
        .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;
    Ok(manager.keys().cloned().collect())
}
