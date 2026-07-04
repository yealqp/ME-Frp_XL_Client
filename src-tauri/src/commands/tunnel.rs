use crate::{config, tunnel};
use crate::tunnel::ProcessManager;

#[tauri::command]
pub async fn api_get_tunnel_logs(
    proxy_id: i32,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<Vec<String>, String> {
    tunnel::get_tunnel_logs(proxy_id, process_manager.inner()).await
}

#[tauri::command]
pub async fn api_get_running_tunnels(
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<Vec<i32>, String> {
    tunnel::get_running_tunnels(process_manager.inner()).await
}

#[tauri::command]
pub async fn api_start_tunnel(
    _app_handle: tauri::AppHandle,
    proxy_id: i32,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.frp_token.is_empty() {
        return Err("未找到有效的frp_token".to_string());
    }

    tunnel::start_tunnel(proxy_id, &config.frp_token, process_manager.inner()).await
}

#[tauri::command]
pub async fn api_stop_tunnel(
    _app_handle: tauri::AppHandle,
    proxy_id: i32,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<String, String> {
    tunnel::stop_tunnel(proxy_id, process_manager.inner()).await
}

#[tauri::command]
pub async fn save_config_file(
    _app_handle: tauri::AppHandle,
    file_name: String,
    content: String,
) -> Result<String, String> {
    tunnel::save_config_file(file_name, content).await
}

#[tauri::command]
pub async fn delete_config_file(
    _app_handle: tauri::AppHandle,
    file_name: String,
) -> Result<String, String> {
    tunnel::delete_config_file(file_name).await
}

#[tauri::command]
pub async fn check_tunnel_config_files(_app_handle: tauri::AppHandle) -> Result<Vec<i32>, String> {
    tunnel::check_tunnel_config_files().await
}
