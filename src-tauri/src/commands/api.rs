use crate::{api, config};
use crate::models::api::VersionCheckResult;

#[tauri::command]
pub async fn api_get_traffic_stats(
    _app_handle: tauri::AppHandle,
    date_period: u32,
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::get_traffic_stats(&config.user_token, date_period).await
}

#[tauri::command]
pub async fn api_get_system_notification(_app_handle: tauri::AppHandle) -> Result<String, String> {
    api::system::get_system_notification().await
}

#[tauri::command]
pub async fn fetch_privacy_policy() -> Result<String, String> {
    api::system::fetch_privacy_policy().await
}

#[tauri::command]
pub async fn api_send_feedback(
    _app_handle: tauri::AppHandle,
    content: String,
    user_id: i32,
) -> Result<String, String> {
    api::feedback::send_feedback(&content, user_id).await
}

#[tauri::command]
pub async fn api_report_analysis(
    _app_handle: tauri::AppHandle,
    me_frp_id: i32,
    username: String,
    email: String,
) -> Result<String, String> {
    api::analysis::report_user_analysis(me_frp_id, &username, &email).await
}

#[tauri::command]
pub async fn api_analyze_log(
    log_content: String,
    custom_prompt: Option<String>,
) -> Result<String, String> {
    api::ai_analysis::analyze_log(&log_content, custom_prompt.as_deref()).await
}

#[tauri::command]
pub async fn check_for_updates() -> Result<VersionCheckResult, String> {
    crate::system::update::check_for_updates().await
}

#[tauri::command]
pub async fn get_update_history() -> Result<VersionCheckResult, String> {
    crate::system::update::get_update_history().await
}
