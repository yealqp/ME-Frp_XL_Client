use crate::config;
use crate::models::config::UnifiedConfig;

#[tauri::command]
pub async fn save_unified_config(
    _app_handle: tauri::AppHandle,
    config: UnifiedConfig,
) -> Result<String, String> {
    config::save_unified_config(&config).await?;
    Ok("统一配置保存成功".to_string())
}

#[tauri::command]
pub async fn load_unified_config(_app_handle: tauri::AppHandle) -> Result<UnifiedConfig, String> {
    config::load_unified_config().await
}
