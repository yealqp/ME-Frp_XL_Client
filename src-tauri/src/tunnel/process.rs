//! 隧道进程管理模块
//!
//! 本模块负责隧道进程的启动、停止、日志捕获和运行状态管理

use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;

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
        child: Arc::new(Mutex::new(Some(child))),
        logs,
    };

    // 启动后台监控：mefrpc 意外退出/崩溃时自动从管理器移除，
    // 避免 UI 一直显示"运行中"且无法重新启动隧道
    // 注意：child 引用需在 insert 移动 tunnel_process 之前克隆
    let child_for_watch = Arc::clone(&tunnel_process.child);

    // 将进程添加到管理器（持锁时二次检查，防止并发 start 导致双启动）
    {
        let mut manager = process_manager
            .lock()
            .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;

        if manager.contains_key(&proxy_id) {
            // 并发启动：终止刚 spawn 的进程，避免产生无法清理的孤儿进程
            drop(manager);
            let _ = stop_child(&child_for_watch);
            return Err("隧道已经在运行中".to_string());
        }

        manager.insert(proxy_id, tunnel_process);
    }

    {
        let manager_clone = Arc::clone(process_manager);
        let child_clone = child_for_watch;
        let watch_proxy_id = proxy_id;
        tokio::task::spawn_blocking(move || {
            loop {
                let exited = {
                    let mut guard = match child_clone.lock() {
                        Ok(guard) => guard,
                        Err(_) => return,
                    };
                    match guard.as_mut() {
                        Some(child) => match child.try_wait() {
                            Ok(Some(_)) => true,
                            Ok(None) => false,
                            Err(_) => true,
                        },
                        // 已被 stop_tunnel 显式停止并移除，无需再清理
                        None => return,
                    }
                };

                if exited {
                    if let Ok(mut manager) = manager_clone.lock() {
                        manager.remove(&watch_proxy_id);
                    }
                    return;
                }

                std::thread::sleep(Duration::from_secs(1));
            }
        });
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
            Ok(logs.iter().cloned().collect())
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
