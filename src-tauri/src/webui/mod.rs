//! WebUI 进程管理模块
//!
//! 本模块负责 MEFrp WebUI 进程的启动、停止和状态管理

use std::io::{BufRead, BufReader};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};

/// WebUI 进程信息
#[derive(Debug)]
pub struct WebUIProcess {
    pub child: Arc<Mutex<Option<Child>>>,
    pub logs: Arc<Mutex<Vec<String>>>,
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
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;
    let exe_dir = exe_path.parent().ok_or("无法获取可执行文件目录")?;

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
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // 在 Windows 上隐藏命令行窗口
    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let mut child = command
        .spawn()
        .map_err(|e| format!("启动 WebUI 进程失败: {}", e))?;

    // 创建日志存储
    let logs = Arc::new(Mutex::new(Vec::new()));
    let logs_clone = logs.clone();

    // 获取进程的 stdout 和 stderr
    let stdout = child.stdout.take().ok_or("无法获取进程 stdout")?;
    let stderr = child.stderr.take().ok_or("无法获取进程 stderr")?;

    // 启动异步任务读取 stdout
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

    // 启动异步任务读取 stderr
    let logs_stderr = logs.clone();
    tokio::task::spawn_blocking(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            if let Ok(mut logs) = logs_stderr.lock() {
                logs.push(format!("[ERR] {}", line));
                // 限制日志数量，避免内存溢出
                if logs.len() > 1000 {
                    logs.remove(0);
                }
            }
        }
    });

    // 创建 WebUI 进程信息
    let webui_process = WebUIProcess {
        child: Arc::new(Mutex::new(Some(child))),
        logs: logs_clone,
        addr: addr.clone(),
        port,
    };

    // 将进程添加到管理器
    {
        let mut manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        *manager = Some(webui_process);
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
            // 尝试终止进程
            let mut child_guard = process
                .child
                .lock()
                .map_err(|e| format!("获取进程锁失败: {}", e))?;
            if let Some(mut child) = child_guard.take() {
                match child.kill() {
                    Ok(_) => {
                        // 等待进程结束
                        let _ = child.wait();
                        Ok("{\"code\": 200, \"message\": \"WebUI 停止成功\", \"data\": null}"
                            .to_string())
                    }
                    Err(e) => Err(format!("终止进程失败: {}", e)),
                }
            } else {
                Err("进程已经被终止".to_string())
            }
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

/// 获取 WebUI 日志
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
            Ok(logs.clone())
        }
        None => Err("未找到运行中的 WebUI 进程".to_string()),
    }
}
