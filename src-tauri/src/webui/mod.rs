//! WebUI 进程管理模块
//!
//! 本模块负责 MEFrp WebUI 进程的启动、停止和状态管理

use std::process::{Child, Command};
use std::sync::{Arc, Mutex};

use crate::utils::process::{exe_dir, spawn_and_capture, stop_child};

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
            stop_child(&process.child).map_err(|e| format!("{}", e))?;
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

/// 登录 WebUI 并获取 session cookie
///
/// # 参数
///
/// * `password` - WebUI 密码
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回 session cookie，失败返回错误信息
pub async fn webui_login(
    password: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    let (addr, port) = {
        let manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        match manager.as_ref() {
            Some(process) => (process.addr.clone(), process.port),
            None => return Err("WebUI 未运行".to_string()),
        }
    };

    let url = format!("http://{}:{}/mefrp/auth", addr, port);
    let body = format!("password={}&redirect=/", urlencoding::encode(&password));

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    let response = client
        .post(&url)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("登录请求失败: {}", e))?;

    // 从响应头获取 session cookie
    if let Some(cookie) = response.headers().get("set-cookie") {
        let cookie_str = cookie
            .to_str()
            .map_err(|e| format!("解析 cookie 失败: {}", e))?;
        if let Some(session) = cookie_str
            .split(';')
            .next()
            .and_then(|s| s.strip_prefix("mefrp_webui_session="))
        {
            return Ok(session.to_string());
        }
    }

    Err("登录失败，未获取到 session cookie".to_string())
}

/// 获取隧道列表
///
/// # 参数
///
/// * `session` - WebUI session cookie
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回隧道列表 JSON，失败返回错误信息
pub async fn webui_get_tunnels(
    session: String,
    user_token: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    let (addr, port) = {
        let manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        match manager.as_ref() {
            Some(process) => (process.addr.clone(), process.port),
            None => return Err("WebUI 未运行".to_string()),
        }
    };

    let url = format!("http://{}:{}/api/mefrp/auth/proxy/list", addr, port);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Cookie", format!("mefrp_webui_session={}", session))
        .header("Authorization", format!("Bearer {}", user_token))
        .send()
        .await
        .map_err(|e| format!("获取隧道列表失败: {}", e))?;

    let text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    Ok(text)
}

/// 启动隧道
///
/// # 参数
///
/// * `session` - WebUI session cookie
/// * `proxy_id` - 隧道 ID
/// * `frp_token` - FRP Token
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回操作结果 JSON，失败返回错误信息
pub async fn webui_start_tunnel(
    session: String,
    proxy_id: u32,
    frp_token: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    let (addr, port) = {
        let manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        match manager.as_ref() {
            Some(process) => (process.addr.clone(), process.port),
            None => return Err("WebUI 未运行".to_string()),
        }
    };

    let url = format!("http://{}:{}/api/proxy/start?proxyId={}", addr, port, proxy_id);

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Cookie", format!("mefrp_webui_session={}", session))
        .header("Authorization", format!("Bearer {}", frp_token))
        .send()
        .await
        .map_err(|e| format!("启动隧道失败: {}", e))?;

    let text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    Ok(text)
}

/// 停止隧道
///
/// # 参数
///
/// * `session` - WebUI session cookie
/// * `proxy_id` - 隧道 ID
/// * `frp_token` - FRP Token
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回操作结果 JSON，失败返回错误信息
pub async fn webui_stop_tunnel(
    session: String,
    proxy_id: u32,
    frp_token: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    let (addr, port) = {
        let manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        match manager.as_ref() {
            Some(process) => (process.addr.clone(), process.port),
            None => return Err("WebUI 未运行".to_string()),
        }
    };

    let url = format!("http://{}:{}/api/proxy/stop?proxyId={}", addr, port, proxy_id);

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Cookie", format!("mefrp_webui_session={}", session))
        .header("Authorization", format!("Bearer {}", frp_token))
        .send()
        .await
        .map_err(|e| format!("停止隧道失败: {}", e))?;

    let text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    Ok(text)
}

/// 获取 WebUI 运行日志
///
/// # 参数
///
/// * `session` - WebUI session cookie
/// * `frp_token` - FRP Token
/// * `webui_manager` - WebUI 进程管理器
///
/// # 返回
///
/// 成功返回日志内容，失败返回错误信息
pub async fn webui_get_logs(
    session: String,
    frp_token: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    let (addr, port) = {
        let manager = webui_manager
            .lock()
            .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
        match manager.as_ref() {
            Some(process) => (process.addr.clone(), process.port),
            None => return Err("WebUI 未运行".to_string()),
        }
    };

    let url = format!("http://{}:{}/api/core/logs?token={}", addr, port, frp_token);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Cookie", format!("mefrp_webui_session={}", session))
        .header("Connection", "keep-alive")
        .header("Accept", "text/event-stream")
        .send()
        .await
        .map_err(|e| format!("获取日志失败: {}", e))?;

    let text = response
        .text()
        .await
        .map_err(|e| format!("读取日志失败: {}", e))?;

    Ok(text)
}
