//! 隧道进程管理模块
//!
//! 本模块负责隧道进程的启动、停止、日志捕获和运行状态管理

use std::process::Command;
use std::sync::{Arc, Mutex};

use crate::models::tunnel::{ProcessManager, TunnelProcess};
use crate::utils::process::{exe_dir, spawn_and_capture, stop_child};

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
    let exe_dir = exe_dir()?;

    let mefrpc_path = exe_dir
        .join("bin")
        .join("mefrpc.exe");

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
        // 使用传统参数启动（快速启动模式）
        command
            .arg("-t")
            .arg(frp_token)
            .arg("-p")
            .arg(proxy_id.to_string())
            .arg("--api-root-url")
            .arg("https://api.mefrp.com");
    }

    // 启动进程并捕获日志
    let (child, logs) = spawn_and_capture(&mut command, "mefrpc")?;

    // 创建隧道进程信息
    let tunnel_process = TunnelProcess {
        proxy_id,
        child: Arc::new(Mutex::new(Some(child))),
        logs,
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
            stop_child(&process.child).map_err(|e| e)?;
            Ok(format!("{{\"code\": 200, \"message\": \"隧道停止成功\", \"data\": {{\"proxyId\": {proxy_id}}}}}"))
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
