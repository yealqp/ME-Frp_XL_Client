//! WebUI HTTP API 模块
//!
//! 本模块负责与运行中的 MEFrp WebUI（mefrpc --webui）之间的 HTTP 交互：
//! - webui_login: 登录并获取 session cookie
//! - webui_get_tunnels: 获取隧道列表
//! - webui_start_tunnel / webui_stop_tunnel: 启动/停止隧道
//! - webui_get_logs: 有限收集 SSE 日志流

use crate::webui::WebUIManager;

/// 从进程管理器中获取 WebUI 监听地址与端口
fn webui_addr_port(webui_manager: &WebUIManager) -> Result<(String, u16), String> {
    let manager = webui_manager
        .lock()
        .map_err(|e| format!("获取 WebUI 管理器锁失败: {}", e))?;
    match manager.as_ref() {
        Some(process) => Ok((process.addr.clone(), process.port)),
        None => Err("WebUI 未运行".to_string()),
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
    let (addr, port) = webui_addr_port(webui_manager)?;

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
/// * `user_token` - ME-Frp 用户 token
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
    let (addr, port) = webui_addr_port(webui_manager)?;

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
    let (addr, port) = webui_addr_port(webui_manager)?;

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
    let (addr, port) = webui_addr_port(webui_manager)?;

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

/// 获取 WebUI 运行日志（SSE 流）
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
///
/// # 说明
///
/// `/api/core/logs` 是 text/event-stream 持续推送的 SSE 流，不会自然关闭。
/// 不能使用 `.text()` 等待 EOF（会永久挂起），这里改为有限时间收集日志后返回。
pub async fn webui_get_logs(
    session: String,
    frp_token: String,
    webui_manager: &WebUIManager,
) -> Result<String, String> {
    let (addr, port) = webui_addr_port(webui_manager)?;

    let url = format!("http://{}:{}/api/core/logs?token={}", addr, port, frp_token);

    let client = reqwest::Client::new();
    let mut response = client
        .get(&url)
        .header("Cookie", format!("mefrp_webui_session={}", session))
        .header("Connection", "keep-alive")
        .header("Accept", "text/event-stream")
        .send()
        .await
        .map_err(|e| format!("获取日志失败: {}", e))?;

    // SSE 流持续推送：最多收集 3 秒或 200KB 日志后返回，
    // 每个分块等待上限 800ms，避免无新数据时无限等待
    const MAX_COLLECT_SECS: u64 = 3;
    const MAX_LOG_BYTES: usize = 200_000;

    let mut buffer: Vec<u8> = Vec::new();
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(MAX_COLLECT_SECS);

    while std::time::Instant::now() < deadline && buffer.len() < MAX_LOG_BYTES {
        match tokio::time::timeout(
            std::time::Duration::from_millis(800),
            response.chunk(),
        )
        .await
        {
            Ok(Ok(Some(chunk))) => buffer.extend_from_slice(&chunk),
            Ok(Ok(None)) => break,
            Ok(Err(e)) => return Err(format!("读取日志失败: {e}")),
            // 一段时间没有新数据，返回已收集的日志
            Err(_) => break,
        }
    }

    Ok(String::from_utf8_lossy(&buffer).into_owned())
}
