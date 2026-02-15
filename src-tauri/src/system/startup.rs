//! 自动启动管理模块
//!
//! 本模块负责管理应用的开机自启动功能。
//!
//! ## 功能
//! - 设置开机自启动（使用 Tauri 插件）

use tauri_plugin_autostart::ManagerExt;

/// 设置开机自启动
///
/// # 参数
/// - `app`: Tauri AppHandle
/// - `enable`: true 启用自启动，false 禁用自启动
///
/// # 返回
/// - `Ok(String)`: 操作成功的消息
/// - `Err(String)`: 操作失败的错误信息
pub async fn set_auto_start(
    app: tauri::AppHandle,
    enable: bool,
) -> Result<String, String> {
    let autostart_manager = app.autolaunch();

    if enable {
        autostart_manager
            .enable()
            .map_err(|e| format!("启用开机自启动失败: {e}"))?;
        Ok("开机自启动已开启".to_string())
    } else {
        autostart_manager
            .disable()
            .map_err(|e| format!("禁用开机自启动失败: {e}"))?;
        Ok("开机自启动已关闭".to_string())
    }
}

/// 检查是否已启用开机自启动
///
/// # 参数
/// - `app`: Tauri AppHandle
///
/// # 返回
/// - `Ok(bool)`: true 表示已启用，false 表示未启用
/// - `Err(String)`: 检查失败的错误信息
pub async fn is_auto_start_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();
    autostart_manager
        .is_enabled()
        .map_err(|e| format!("检查开机自启动状态失败: {e}"))
}
