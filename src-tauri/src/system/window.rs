//! 窗口管理模块
//!
//! 本模块负责窗口相关的系统功能，包括：
//! - 设置窗口置顶
//! - 显示/隐藏窗口
//! - 设置最小化到托盘行为
//! - 退出应用

use crate::models::tunnel::TunnelProcess;
use crate::tunnel::ProcessManager;
use crate::utils::process::stop_child;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

/// 获取进程管理器锁，短暂争用（最多 3 次 × 100ms）后放弃
///
/// 退出路径上锁失败不应静默跳过清理，先重试再放弃并记录日志
fn lock_process_manager(
    process_manager: &ProcessManager,
) -> Option<MutexGuard<'_, HashMap<i32, TunnelProcess>>> {
    for _ in 0..3 {
        if let Ok(guard) = process_manager.lock() {
            return Some(guard);
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    eprintln!("获取进程管理器锁失败，跳过隧道清理");
    None
}

fn stop_all_tunnels(process_manager: &ProcessManager) {
    let running_tunnels = match lock_process_manager(process_manager) {
        Some(manager) => manager.keys().cloned().collect::<Vec<_>>(),
        None => return,
    };

    for proxy_id in running_tunnels {
        let tunnel_process = match lock_process_manager(process_manager) {
            Some(mut manager) => manager.remove(&proxy_id),
            None => None,
        };

        if let Some(tunnel_process) = tunnel_process {
            let _ = stop_child(&tunnel_process.child);
        }
    }
}

pub async fn open_url(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle
        .opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("打开 URL 失败: {}", e))
}

pub async fn open_webview_window(
    app_handle: tauri::AppHandle,
    url: String,
    window_id: String,
    title: String,
) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;

    if let Some(window) = app_handle.get_webview_window(&window_id) {
        window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
        window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))?;
        return Ok(());
    }

    let window = WebviewWindowBuilder::new(
        &app_handle,
        &window_id,
        WebviewUrl::External(url.parse().map_err(|e| format!("URL 解析失败: {}", e))?),
    )
    .title(&title)
    .inner_size(1200.0, 800.0)
    .min_inner_size(800.0, 600.0)
    .resizable(true)
    .visible(false)
    .build()
    .map_err(|e| format!("创建窗口失败: {}", e))?;

    window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
    window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))?;

    Ok(())
}

pub async fn close_webview_window(
    app_handle: tauri::AppHandle,
    window_id: String,
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        let _ = window.hide();

        let window_clone = window.clone();
        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
            if let Err(e) = window_clone.close() {
                eprintln!("关闭窗口时出错（可忽略）: {}", e);
            }
        });
    }
    Ok(())
}

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
    stop_all_tunnels(process_manager);

    app_handle.exit(0);
    Ok("应用已退出".to_string())
}

pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let show_main = MenuItem::with_id(app, "show_main", "显示主页面", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_main, &quit])?;

    let tray_icon = app.default_window_icon().cloned().unwrap_or_else(|| {
        tauri::image::Image::new_owned(vec![0, 0, 0, 0], 1, 1)
    });

    let _tray = TrayIconBuilder::new()
        .icon(tray_icon)
        .tooltip("ME-Frp XL Client")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show_main" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }
            "quit" => {
                // 先同步清理所有隧道进程，避免前端无响应（webview 卡死等）时残留 mefrpc 进程
                if let Some(manager) = app.try_state::<ProcessManager>() {
                    stop_all_tunnels(manager.inner());
                }
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("quit-app", ());
                }
                // 给前端处理 quit-app 事件（调用 quit_app 优雅退出）留出时间，
                // 若前端无响应则 3 秒后兜底退出
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    std::process::exit(0);
                });
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                if let Some(app) = tray.app_handle().get_webview_window("main") {
                    if app.is_visible().unwrap_or(false) {
                        let _ = app.hide();
                    } else {
                        let _ = app.show();
                        let _ = app.set_focus();
                    }
                }
            }
            TrayIconEvent::DoubleClick { .. } => {
                if let Some(app) = tray.app_handle().get_webview_window("main") {
                    let _ = app.show();
                    let _ = app.set_focus();
                }
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

pub fn handle_close_requested(window: &tauri::Window, api: &tauri::CloseRequestApi) {
    let minimize_to_tray = window
        .app_handle()
        .state::<Arc<Mutex<bool>>>()
        .lock()
        .map(|state| *state)
        .unwrap_or(true);

    api.prevent_close();

    if minimize_to_tray {
        let _ = window.hide();
        return;
    }

    let app_handle = window.app_handle();
    let process_manager = app_handle.state::<ProcessManager>();
    let app_handle_clone = app_handle.clone();
    let process_manager_clone = process_manager.inner().clone();

    std::thread::spawn(move || {
        stop_all_tunnels(&process_manager_clone);
        std::thread::sleep(std::time::Duration::from_millis(200));
        app_handle_clone.exit(0);
    });
}

