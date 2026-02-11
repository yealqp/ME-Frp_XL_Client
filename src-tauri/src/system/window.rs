//! 窗口管理模块
//!
//! 本模块负责窗口相关的系统功能，包括：
//! - 设置窗口置顶
//! - 显示/隐藏窗口
//! - 设置最小化到托盘行为
//! - 退出应用

use crate::tunnel::ProcessManager;
use std::sync::{Arc, Mutex};
use tauri::Manager;

/// 设置窗口置顶
///
/// # 参数
/// * `app_handle` - Tauri应用句柄
/// * `always_on_top` - 是否置顶
///
/// # 返回
/// * `Ok(String)` - 操作成功消息
/// * `Err(String)` - 错误信息
pub async fn set_always_on_top(
    app_handle: &tauri::AppHandle,
    always_on_top: bool,
) -> Result<String, String> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or("未找到主窗口")?;

    window
        .set_always_on_top(always_on_top)
        .map_err(|e| format!("设置窗口置顶失败: {e}"))?;

    Ok(if always_on_top {
        "窗口置顶已开启"
    } else {
        "窗口置顶已关闭"
    }
    .to_string())
}

/// 显示窗口
///
/// # 参数
/// * `app_handle` - Tauri应用句柄
///
/// # 返回
/// * `Ok(String)` - 操作成功消息
/// * `Err(String)` - 错误信息
pub async fn show_window(app_handle: &tauri::AppHandle) -> Result<String, String> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or("未找到主窗口")?;

    window.show().map_err(|e| format!("显示窗口失败: {e}"))?;
    window
        .set_focus()
        .map_err(|e| format!("设置窗口焦点失败: {e}"))?;

    Ok("窗口已显示".to_string())
}

/// 隐藏窗口
///
/// # 参数
/// * `app_handle` - Tauri应用句柄
///
/// # 返回
/// * `Ok(String)` - 操作成功消息
/// * `Err(String)` - 错误信息
pub async fn hide_window(app_handle: &tauri::AppHandle) -> Result<String, String> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or("未找到主窗口")?;

    window.hide().map_err(|e| format!("隐藏窗口失败: {e}"))?;

    Ok("窗口已隐藏".to_string())
}

/// 设置最小化到托盘行为
///
/// # 参数
/// * `app_handle` - Tauri应用句柄
/// * `minimize_to_tray` - 是否最小化到托盘
///
/// # 返回
/// * `Ok(String)` - 操作成功消息
/// * `Err(String)` - 错误信息
pub async fn set_minimize_to_tray(
    app_handle: &tauri::AppHandle,
    minimize_to_tray: bool,
) -> Result<String, String> {
    // 保存设置到应用状态中
    app_handle
        .state::<Arc<Mutex<bool>>>()
        .lock()
        .map_err(|e| format!("获取状态锁失败: {e}"))?
        .clone_from(&minimize_to_tray);

    Ok(if minimize_to_tray {
        "最小化到托盘已开启"
    } else {
        "最小化到托盘已关闭"
    }
    .to_string())
}

/// 退出应用
///
/// 在退出前会停止所有正在运行的隧道进程
///
/// # 参数
/// * `app_handle` - Tauri应用句柄
/// * `process_manager` - 进程管理器
///
/// # 返回
/// * `Ok(String)` - 操作成功消息
/// * `Err(String)` - 错误信息
pub async fn quit_app(
    app_handle: &tauri::AppHandle,
    process_manager: &ProcessManager,
) -> Result<String, String> {
    // 先停止所有正在运行的隧道
    let manager = process_manager
        .lock()
        .map_err(|e| format!("获取进程管理器锁失败: {e}"))?;

    // 收集所有正在运行的隧道ID
    let running_tunnels: Vec<i32> = manager.keys().cloned().collect();
    drop(manager); // 释放锁

    // 逐个停止隧道
    for proxy_id in running_tunnels {
        if let Ok(mut manager) = process_manager.lock() {
            if let Some(tunnel_process) = manager.get_mut(&proxy_id) {
                if let Ok(mut child_opt) = tunnel_process.child.lock() {
                    if let Some(ref mut child) = *child_opt {
                        let _ = child.kill(); // 强制终止进程
                        let _ = child.wait(); // 等待进程结束
                    }
                }
            }
            manager.remove(&proxy_id); // 从管理器中移除
        }
    }

    app_handle.exit(0);
    Ok("应用已退出".to_string())
}
