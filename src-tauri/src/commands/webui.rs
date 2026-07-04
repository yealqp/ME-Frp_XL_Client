use crate::webui;

#[tauri::command]
pub async fn start_webui(
    _app_handle: tauri::AppHandle,
    addr: String,
    port: u16,
    pass: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::start_webui(addr, port, pass, webui_manager.inner()).await
}

#[tauri::command]
pub async fn stop_webui(
    _app_handle: tauri::AppHandle,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::stop_webui(webui_manager.inner()).await
}

#[tauri::command]
pub async fn is_webui_running(
    _app_handle: tauri::AppHandle,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<bool, String> {
    webui::is_webui_running(webui_manager.inner()).await
}

#[tauri::command]
pub async fn get_webui_logs(
    _app_handle: tauri::AppHandle,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<Vec<String>, String> {
    webui::get_webui_logs(webui_manager.inner()).await
}

#[tauri::command]
pub async fn webui_login(
    password: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_login(password, webui_manager.inner()).await
}

#[tauri::command]
pub async fn webui_get_tunnels(
    session: String,
    user_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_get_tunnels(session, user_token, webui_manager.inner()).await
}

#[tauri::command]
pub async fn webui_start_tunnel(
    session: String,
    proxy_id: u32,
    frp_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_start_tunnel(session, proxy_id, frp_token, webui_manager.inner()).await
}

#[tauri::command]
pub async fn webui_stop_tunnel(
    session: String,
    proxy_id: u32,
    frp_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_stop_tunnel(session, proxy_id, frp_token, webui_manager.inner()).await
}
