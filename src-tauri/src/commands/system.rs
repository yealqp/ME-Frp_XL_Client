use crate::{system, tunnel};

#[tauri::command]
pub async fn copy_background_image_to_temp(source_path: String) -> Result<String, String> {
    system::background::copy_background_image_to_temp(source_path).await
}

#[tauri::command]
pub async fn remove_managed_background_image(relative_path: String) -> Result<(), String> {
    system::background::remove_managed_background_image(relative_path).await
}

#[tauri::command]
pub async fn resolve_managed_background_image_path(relative_path: String) -> Result<String, String> {
    system::background::resolve_managed_background_image_path(relative_path).await
}

#[tauri::command]
pub async fn read_managed_background_image_data_url(relative_path: String) -> Result<String, String> {
    system::background::read_managed_background_image_data_url(relative_path).await
}

#[tauri::command]
pub async fn set_auto_start(app: tauri::AppHandle, enable: bool) -> Result<String, String> {
    system::startup::set_auto_start(app, enable).await
}

#[tauri::command]
pub async fn is_auto_start_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    system::startup::is_auto_start_enabled(app).await
}

#[tauri::command]
pub async fn set_always_on_top(
    app_handle: tauri::AppHandle,
    always_on_top: bool,
) -> Result<String, String> {
    system::window::set_always_on_top(&app_handle, always_on_top).await
}

#[tauri::command]
pub async fn set_minimize_to_tray(
    app_handle: tauri::AppHandle,
    minimize_to_tray: bool,
) -> Result<String, String> {
    system::window::set_minimize_to_tray(&app_handle, minimize_to_tray).await
}

#[tauri::command]
pub async fn quit_app(
    app_handle: tauri::AppHandle,
    process_manager: tauri::State<'_, tunnel::ProcessManager>,
) -> Result<String, String> {
    system::window::quit_app(&app_handle, process_manager.inner()).await
}

#[tauri::command]
pub fn get_app_version() -> String {
    system::update::get_app_version()
}

#[tauri::command]
pub async fn download_and_install_update(version: String) -> Result<String, String> {
    system::update::download_and_install_update(version).await
}

#[tauri::command]
pub async fn open_url(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    system::window::open_url(app_handle, url).await
}

#[tauri::command]
pub async fn open_webview_window(
    app_handle: tauri::AppHandle,
    url: String,
    window_id: String,
    title: String,
) -> Result<(), String> {
    system::window::open_webview_window(app_handle, url, window_id, title).await
}

#[tauri::command]
pub async fn close_webview_window(
    app_handle: tauri::AppHandle,
    window_id: String,
) -> Result<(), String> {
    system::window::close_webview_window(app_handle, window_id).await
}
