//! WebUI 进程管理模块
//!
//! 本模块负责 MEFrp WebUI 进程的启动、停止、状态管理和本地日志读取；
//! WebUI 的 HTTP 交互（登录/隧道操作/SSE 日志）见 `api` 子模块。

pub mod api;

use std::collections::VecDeque;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::utils::process::{exe_dir, spawn_and_capture, stop_child};

/// WebUI 进程信息
#[derive(Debug)]
pub struct WebUIProcess {
    pub child: Arc<Mutex<Option<Child>>>,
    /// 环形日志缓冲（上限由写入方控制），VecDeque 保证队首弹出为 O(1)
    pub logs: Arc<Mutex<VecDeque<String>>>,
    pub addr: String,
    pub port: u16,
}

/// WebUI 进程管理器类型别名
pub type WebUIManager = Arc<Mutex<Option<WebUIProcess>>>;

/// 启动 WebUI 进程
///
/// # 参数
///
/// * `addr` - WebUI 监听地址
/// * `port` - WebUI 监听端口
/// * `pass` - WebUI 访问密码
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回 JSON 响应，失败返回错误信息
pub async fn start_webui(
    addr: String,
    port: u16,
    pass: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    // 检查是否已经有进程在运行
    {
        let manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        if manager.is_some() {
            return Err("WebUI 已经在运行中".to_string());
        }
    }

    // 获取可执行文件同目录下 bin 文件夹中的 mefrpc 可执行文件路径
    let exe_dir = exe_dir()?;
    let mefrpc_path = exe_dir.join("bin").join("mefrpc.exe");

    if !mefrpc_path.exists() {
        return Err(format!("mefrpc.exe 不存在: {}", mefrpc_path.display()));
    }

    // 启动 mefrpc 进程，使用 WebUI 参数
    let mut command = Command::new(&mefrpc_path);
    command
        .arg("--webui")
        .arg("--webui-addr")
        .arg(&addr)
        .arg("--webui-port")
        .arg(port.to_string())
        .arg("--webui-pass")
        .arg(&pass)
        .arg("--api-root-url")
        .arg("https://api.mefrp.com");

    // 启动进程并捕获日志
    let (child, logs) = spawn_and_capture(&mut command, "WebUI")?;

    // 创建 WebUI 进程信息
    let webui_process = WebUIProcess {
        child: Arc::new(Mutex::new(Some(child))),
        logs,
        addr: addr.clone(),
        port,
    };

    // 将进程添加到管理器（持锁时二次检查，防止并发 start 双启动）
    let child_for_watch = Arc::clone(&webui_process.child);
    {
        let mut manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;

        if manager.is_some() {
            // 并发启动：终止刚 spawn 的进程，避免产生孤儿进程
            drop(manager);
            let _ = stop_child(&child_for_watch);
            return Err("WebUI 已经在运行中".to_string());
        }

        *manager = Some(webui_process);
    }

    // 后台监控：mefrpc WebUI 进程意外退出/崩溃时自动清空管理器，
    // 避免 UI 一直显示"运行中"且无法重新启动
    {
        let manager_clone = Arc::clone(webui_manager);
        tokio::task::spawn_blocking(move || {
            loop {
                let exited = {
                    let mut guard = match child_for_watch.lock() {
                        Ok(guard) => guard,
                        Err(_) => return,
                    };
                    match guard.as_mut() {
                        Some(child) => match child.try_wait() {
                            Ok(Some(_)) => true,
                            Ok(None) => false,
                            Err(_) => true,
                        },
                        // 已被 stop_webui 显式停止并清空，无需再处理
                        None => return,
                    }
                };

                if exited {
                    if let Ok(mut manager) = manager_clone.lock() {
                        if let Some(process) = manager.as_ref() {
                            if Arc::ptr_eq(&process.child, &child_for_watch) {
                                *manager = None;
                            }
                        }
                    }
                    return;
                }

                std::thread::sleep(Duration::from_secs(1));
            }
        });
    }

    Ok(format!(
        "{{\"code\": 200, \"message\": \"WebUI 启动成功\", \"data\": {{\"addr\": \"{}\", \"port\": {}}}}}",
        addr, port
    ))
}

/// 停止 WebUI 进程
///
/// # 参数
///
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回 JSON 响应，失败返回错误信息
pub async fn stop_webui(webui_manager: &WebUIManager) -> Result<String, String> {
    // 从进程管理器中获取并移除进程
    let webui_process = {
        let mut manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        manager.take()
    };

    match webui_process {
        Some(process) => {
            stop_child(&process.child)?;
            Ok("{\"code\": 200, \"message\": \"WebUI 停止成功\", \"data\": null}"
                .to_string())
        }
        None => Err("未找到运行中的 WebUI 进程".to_string()),
    }
}

/// 获取 WebUI 运行状态
///
/// # 参数
///
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 返回 WebUI 是否正在运行
pub async fn is_webui_running(webui_manager: &WebUIManager) -> Result<bool, String> {
    let manager = webui_manager
        .lock()
        .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
    Ok(manager.is_some())
}

/// 获取 WebUI 本地进程日志
///
/// # 参数
///
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回日志行列表，失败返回错误信息
pub async fn get_webui_logs(webui_manager: &WebUIManager) -> Result<Vec<String>, String> {
    let manager = webui_manager
        .lock()
        .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;

    match manager.as_ref() {
        Some(process) => {
            let logs = process
                .logs
                .lock()
                .map_err(|e| format!("获取日志锁失败: {}", e))?;
            Ok(logs.iter().cloned().collect())
        }
        None => Err("未找到运行中的 WebUI 进程".to_string()),
    }
}

// 重导出 HTTP API 层，保持 commands/webui.rs 的调用路径不变
pub use api::{
    webui_get_logs, webui_get_tunnels, webui_login, webui_start_tunnel, webui_stop_tunnel,
};
