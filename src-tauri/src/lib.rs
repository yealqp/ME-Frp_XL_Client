// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

//! # ME-Frp Desktop 后端
//!
//! 本模块是 ME-Frp Desktop 应用的 Rust 后端实现。
//!
//! ## 模块结构
//!
//! - `models`: 数据结构定义，包含认证、隧道、配置和API响应相关的结构体
//! - `config`: 配置管理，负责配置文件的读取、保存和迁移
//! - `api`: API请求封装，包含认证、隧道、节点和系统相关的API调用
//! - `tunnel`: 隧道管理，负责隧道进程的启动、停止和日志管理
//! - `system`: 系统功能，包含窗口管理、自动启动和版本更新
//! - `utils`: 工具函数，提供HTTP客户端等通用功能
//!
//! ## 依赖关系
//!
//! - `models` 和 `utils` 是基础模块，不依赖其他业务模块
//! - `config`、`api`、`tunnel`、`system` 等业务模块依赖 `models` 和 `utils`
//! - 所有模块避免循环依赖，保持清晰的层次结构
//!
//! ## Tauri 命令
//!
//! 本文件定义了所有可从前端调用的 Tauri 命令，这些命令作为前端和后端模块之间的桥梁。

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

// 模块声明
pub mod api;
pub mod config;
pub mod models;
pub mod system;
pub mod tunnel;
pub mod utils;
pub mod webui;

// 导入模块中的类型
use models::api::VersionCheckResult;
use models::config::UnifiedConfig;
use tunnel::ProcessManager;

fn managed_background_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe().map_err(|e| format!("获取可执行文件路径失败: {e}"))?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "获取可执行文件目录失败".to_string())?;
    Ok(exe_dir.join("temp"))
}

fn managed_background_relative_path(file_name: &str) -> String {
    format!("temp/{file_name}")
}

fn managed_background_absolute_path(relative_path: &str) -> Result<PathBuf, String> {
    if !relative_path.starts_with("temp/") {
        return Err("非法的背景图片路径".to_string());
    }

    let file_name = relative_path.trim_start_matches("temp/");
    if file_name.is_empty()
        || file_name.contains('/')
        || file_name.contains('\\')
        || file_name.contains("..")
    {
        return Err("非法的背景图片路径".to_string());
    }

    let target_dir = managed_background_dir()?;
    Ok(target_dir.join(file_name))
}

fn unique_background_file_name(source: &Path) -> Result<String, String> {
    let stem = source
        .file_stem()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "无法解析图片文件名".to_string())?;
    let extension = source
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| format!(".{ext}"))
        .unwrap_or_default();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("获取时间戳失败: {e}"))?
        .as_millis();

    Ok(format!("{stem}-{timestamp}{extension}"))
}

#[tauri::command]
async fn copy_background_image_to_temp(source_path: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("源图片不存在".to_string());
    }

    let file_name = unique_background_file_name(source)?;

    let target_dir = managed_background_dir()?;
    fs::create_dir_all(&target_dir).map_err(|e| format!("创建背景目录失败: {e}"))?;

    let target_path = target_dir.join(&file_name);
    fs::copy(source, &target_path).map_err(|e| format!("复制背景图片失败: {e}"))?;

    Ok(managed_background_relative_path(&file_name))
}

#[tauri::command]
async fn remove_managed_background_image(relative_path: String) -> Result<(), String> {
    if !relative_path.starts_with("temp/") {
        return Ok(());
    }

    let target_path = managed_background_absolute_path(&relative_path)?;

    if target_path.exists() {
        fs::remove_file(&target_path).map_err(|e| format!("删除背景图片失败: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
async fn resolve_managed_background_image_path(relative_path: String) -> Result<String, String> {
    let target_path = managed_background_absolute_path(&relative_path)?;

    if !target_path.exists() {
        return Err("背景图片不存在".to_string());
    }

    Ok(target_path.to_string_lossy().into_owned())
}

fn managed_background_mime(target_path: &Path) -> &'static str {
    match target_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
        .as_deref()
    {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("jfif") => "image/jpeg",
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        Some("avif") => "image/avif",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        _ => "image/png",
    }
}

#[cfg(test)]
mod tests {
    use super::{managed_background_absolute_path, managed_background_mime};
    use std::path::Path;

    #[test]
    fn managed_background_mime_supports_extended_image_types() {
        assert_eq!(managed_background_mime(Path::new("wallpaper.avif")), "image/avif");
        assert_eq!(managed_background_mime(Path::new("wallpaper.svg")), "image/svg+xml");
        assert_eq!(managed_background_mime(Path::new("wallpaper.ico")), "image/x-icon");
        assert_eq!(managed_background_mime(Path::new("wallpaper.jfif")), "image/jpeg");
    }

    #[test]
    fn managed_background_absolute_path_restricts_to_temp_directory() {
        let path = managed_background_absolute_path("temp/wallpaper.jpeg")
            .expect("managed temp path should resolve");

        assert!(path.ends_with(Path::new("temp").join("wallpaper.jpeg")));
        assert!(managed_background_absolute_path("wallpaper.jpeg").is_err());
        assert!(managed_background_absolute_path("temp/../wallpaper.jpeg").is_err());
        assert!(managed_background_absolute_path("temp/foo/bar.jpeg").is_err());
        assert!(managed_background_absolute_path("temp\\wallpaper.jpeg").is_err());
    }
}

#[tauri::command]
async fn read_managed_background_image_data_url(relative_path: String) -> Result<String, String> {
    let target_path = managed_background_absolute_path(&relative_path)?;
    let bytes = fs::read(&target_path).map_err(|e| format!("读取背景图片失败: {e}"))?;
    let mime = managed_background_mime(&target_path);
    let encoded = STANDARD.encode(bytes);

    Ok(format!("data:{mime};base64,{encoded}"))
}

#[tauri::command]
async fn clear_config(_app_handle: tauri::AppHandle) -> Result<String, String> {
    config::clear_config().await?;
    Ok("Config cleared successfully".to_string())
}

// 获取流量统计API命令（保留在后端以绕过CORS）
#[tauri::command]
async fn api_get_traffic_stats(
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

// 获取系统通知API命令（xlc.mefrp.yealqp.cn — 非 api.mefrp.com）
#[tauri::command]
async fn api_get_system_notification(_app_handle: tauri::AppHandle) -> Result<String, String> {
    api::system::get_system_notification().await
}

// 获取隧道日志（本地进程）
#[tauri::command]
async fn api_get_tunnel_logs(
    proxy_id: i32,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<Vec<String>, String> {
    tunnel::get_tunnel_logs(proxy_id, process_manager.inner()).await
}

// 获取所有运行中的隧道（本地进程查询）
#[tauri::command]
async fn api_get_running_tunnels(
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<Vec<i32>, String> {
    tunnel::get_running_tunnels(process_manager.inner()).await
}

// 启动隧道命令（使用mefrpc.exe）
#[tauri::command]
async fn api_start_tunnel(
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

// 停止隧道命令（kill mefrpc进程）
#[tauri::command]
async fn api_stop_tunnel(
    _app_handle: tauri::AppHandle,
    proxy_id: i32,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<String, String> {
    tunnel::stop_tunnel(proxy_id, process_manager.inner()).await
}

// 下线所有隧道命令已删除，改为前端直接调用 API

// 设置开机自启动
#[tauri::command]
async fn set_auto_start(app: tauri::AppHandle, enable: bool) -> Result<String, String> {
    system::startup::set_auto_start(app, enable).await
}

// 检查开机自启动状态
#[tauri::command]
async fn is_auto_start_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    system::startup::is_auto_start_enabled(app).await
}

// 设置窗口置顶
#[tauri::command]
async fn set_always_on_top(
    app_handle: tauri::AppHandle,
    always_on_top: bool,
) -> Result<String, String> {
    system::window::set_always_on_top(&app_handle, always_on_top).await
}

// 显示窗口
#[tauri::command]
async fn show_window(app_handle: tauri::AppHandle) -> Result<String, String> {
    system::window::show_window(&app_handle).await
}

// 隐藏窗口
#[tauri::command]
async fn hide_window(app_handle: tauri::AppHandle) -> Result<String, String> {
    system::window::hide_window(&app_handle).await
}

// 设置最小化到托盘行为
#[tauri::command]
async fn set_minimize_to_tray(
    app_handle: tauri::AppHandle,
    minimize_to_tray: bool,
) -> Result<String, String> {
    system::window::set_minimize_to_tray(&app_handle, minimize_to_tray).await
}

// 退出应用
#[tauri::command]
async fn quit_app(
    app_handle: tauri::AppHandle,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<String, String> {
    system::window::quit_app(&app_handle, process_manager.inner()).await
}

// 获取应用版本号
#[tauri::command]
fn get_app_version() -> String {
    system::update::get_app_version()
}

// 检查版本更新
#[tauri::command]
async fn check_for_updates() -> Result<VersionCheckResult, String> {
    system::update::check_for_updates().await
}

// 获取完整更新历史
#[tauri::command]
async fn get_update_history() -> Result<VersionCheckResult, String> {
    system::update::get_update_history().await
}

// 下载并安装更新
#[tauri::command]
async fn download_and_install_update(version: String) -> Result<String, String> {
    system::update::download_and_install_update(version).await
}

// 获取隐私政策
#[tauri::command]
async fn fetch_privacy_policy() -> Result<String, String> {
    let client = utils::create_http_client();
    
    let response = client
        .get("https://xlc.mefrp.yealqp.cn/privacy.md")
        .send()
        .await
        .map_err(|e| format!("请求隐私政策失败: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("获取隐私政策失败，状态码: {}", response.status()));
    }
    
    let text = response
        .text()
        .await
        .map_err(|e| format!("读取隐私政策内容失败: {}", e))?;
    
    Ok(text)
}

// 统一配置管理函数
#[tauri::command]
async fn save_unified_config(
    _app_handle: tauri::AppHandle,
    config: UnifiedConfig,
) -> Result<String, String> {
    config::save_unified_config(&config).await?;
    Ok("统一配置保存成功".to_string())
}

#[tauri::command]
async fn load_unified_config(_app_handle: tauri::AppHandle) -> Result<UnifiedConfig, String> {
    config::load_unified_config().await
}

#[tauri::command]
async fn migrate_old_configs(_app_handle: tauri::AppHandle) -> Result<UnifiedConfig, String> {
    config::migrate_old_configs().await
}

// 通用API请求命令
#[tauri::command]
async fn api_request(
    _app_handle: tauri::AppHandle,
    method: String,
    url: String,
    data: String,
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::api_request(&config.user_token, method, url, data).await
}

// 保存配置文件到本地
#[tauri::command]
async fn save_config_file(
    _app_handle: tauri::AppHandle,
    file_name: String,
    content: String,
) -> Result<String, String> {
    tunnel::save_config_file(file_name, content).await
}

// 删除配置文件
#[tauri::command]
async fn delete_config_file(
    _app_handle: tauri::AppHandle,
    file_name: String,
) -> Result<String, String> {
    tunnel::delete_config_file(file_name).await
}

// 检查隧道是否有配置文件
#[tauri::command]
async fn check_tunnel_config_files(_app_handle: tauri::AppHandle) -> Result<Vec<i32>, String> {
    tunnel::check_tunnel_config_files().await
}

// 发送反馈到QQ群
#[tauri::command]
async fn api_send_feedback(
    _app_handle: tauri::AppHandle,
    content: String,
    user_id: i32,
) -> Result<String, String> {
    api::feedback::send_feedback(&content, user_id).await
}

// WebUI 相关命令

/// 启动 WebUI
#[tauri::command]
async fn start_webui(
    _app_handle: tauri::AppHandle,
    addr: String,
    port: u16,
    pass: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::start_webui(addr, port, pass, webui_manager.inner()).await
}

/// 停止 WebUI
#[tauri::command]
async fn stop_webui(
    _app_handle: tauri::AppHandle,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::stop_webui(webui_manager.inner()).await
}

/// 获取 WebUI 运行状态
#[tauri::command]
async fn is_webui_running(
    _app_handle: tauri::AppHandle,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<bool, String> {
    webui::is_webui_running(webui_manager.inner()).await
}

/// 获取 WebUI 日志
#[tauri::command]
async fn get_webui_logs(
    _app_handle: tauri::AppHandle,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<Vec<String>, String> {
    webui::get_webui_logs(webui_manager.inner()).await
}

/// 打开 URL（在默认浏览器中）
#[tauri::command]
async fn open_url(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle
        .opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("打开 URL 失败: {}", e))
}

/// 打开 WebView 窗口（通用）
#[tauri::command]
async fn open_webview_window(
    app_handle: tauri::AppHandle,
    url: String,
    window_id: String,
    title: String,
) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;

    // 检查窗口是否已存在
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        // 如果窗口已存在，显示并聚焦
        window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
        window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))?;
        return Ok(());
    }

    // 创建新的 WebView 窗口
    let window = WebviewWindowBuilder::new(
        &app_handle,
        &window_id,
        WebviewUrl::External(url.parse().map_err(|e| format!("URL 解析失败: {}", e))?)
    )
    .title(&title)
    .inner_size(1200.0, 800.0)
    .min_inner_size(800.0, 600.0)
    .resizable(true)
    .visible(false) // 先创建为不可见，避免闪烁
    .build()
    .map_err(|e| format!("创建窗口失败: {}", e))?;

    // 添加窗口关闭事件监听器，确保资源正确清理
    let window_id_clone = window_id.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Destroyed = event {
            // 窗口被销毁时的清理逻辑
            // 这里可以添加额外的清理代码
            println!("WebView 窗口 {} 已销毁", window_id_clone);
        }
    });

    // 窗口创建后再显示
    window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
    window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))?;

    Ok(())
}

/// 关闭 WebView 窗口（通用）
#[tauri::command]
async fn close_webview_window(
    app_handle: tauri::AppHandle,
    window_id: String,
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        // 先隐藏窗口，避免用户看到关闭过程
        let _ = window.hide();
        
        // 使用更长的延迟，给 Windows 足够的时间清理资源
        // 这可以避免 "Failed to unregister class" 错误
        let window_clone = window.clone();
        tokio::spawn(async move {
            // 延迟 300ms，确保 UI 线程和 WebView2 有足够时间处理
            // 这个延迟对用户体验影响很小，因为窗口已经隐藏
            tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
            
            // 尝试关闭窗口，忽略错误（窗口可能已经被用户关闭）
            if let Err(e) = window_clone.close() {
                eprintln!("关闭窗口时出错（可忽略）: {}", e);
            }
        });
    }
    Ok(())
}

/// 登录 WebUI
#[tauri::command]
async fn webui_login(
    password: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_login(password, webui_manager.inner()).await
}

/// 获取 WebUI 隧道列表
#[tauri::command]
async fn webui_get_tunnels(
    session: String,
    user_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_get_tunnels(session, user_token, webui_manager.inner()).await
}

/// 启动 WebUI 隧道
#[tauri::command]
async fn webui_start_tunnel(
    session: String,
    proxy_id: u32,
    frp_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_start_tunnel(session, proxy_id, frp_token, webui_manager.inner()).await
}

/// 停止 WebUI 隧道
#[tauri::command]
async fn webui_stop_tunnel(
    session: String,
    proxy_id: u32,
    frp_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_stop_tunnel(session, proxy_id, frp_token, webui_manager.inner()).await
}

/// 获取 WebUI 运行日志
#[tauri::command]
async fn webui_get_logs(
    session: String,
    frp_token: String,
    webui_manager: tauri::State<'_, webui::WebUIManager>,
) -> Result<String, String> {
    webui::webui_get_logs(session, frp_token, webui_manager.inner()).await
}

#[tauri::command]
async fn api_analyze_log(log_content: String, custom_prompt: Option<String>) -> Result<String, String> {
    crate::api::ai_analysis::analyze_log(&log_content, custom_prompt.as_deref()).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let process_manager: ProcessManager = Arc::new(Mutex::new(HashMap::new()));
    let webui_manager: webui::WebUIManager = Arc::new(Mutex::new(None));
    let minimize_to_tray_state: Arc<Mutex<bool>> = Arc::new(Mutex::new(true)); // 默认开启最小化到托盘

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]), // 添加启动参数，表示是开机自启动
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当检测到已有实例运行时，显示现有窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }))
        .setup(|app| {
            // 在应用启动时同步加载配置（如果需要则迁移旧配置）
            // 使用 block_on 确保配置在应用启动前加载完成
            tauri::async_runtime::block_on(async move {
                match config::load_unified_config().await {
                    Ok(config) => {
                        println!("配置加载成功");
                        // 打印登录状态以便调试
                        if !config.user_token.is_empty() {
                            println!("检测到已登录用户: {}", config.username);
                        } else {
                            println!("未检测到登录信息");
                        }
                    }
                    Err(e) => {
                        eprintln!("配置加载失败: {e}");
                    }
                }
            });

            // 创建托盘菜单项
            let show_main = MenuItem::with_id(app, "show_main", "显示主页面", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_main, &quit])?;

            // 创建系统托盘
            let tray_icon = app.default_window_icon().cloned().unwrap_or_else(|| {
                // 1x1 透明 RGBA 回退图标
                tauri::image::Image::new_owned(vec![0, 0, 0, 0], 1, 1)
            });
            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .tooltip("ME-Frp XL Client")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "show_main" => {
                            // 显示主窗口
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.unminimize();
                            }
                        }
                        "quit" => {
                            // 调用quit_app命令来确保停止所有隧道进程
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("quit-app", ());
                            }
                            // 延迟退出以确保隧道进程有时间停止
                            std::thread::spawn(move || {
                                std::thread::sleep(std::time::Duration::from_millis(500));
                                std::process::exit(0);
                            });
                        }
                        _ => {}
                    }
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
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 获取最小化到托盘设置
                let minimize_to_tray = window
                    .app_handle()
                    .state::<Arc<Mutex<bool>>>()
                    .lock()
                    .map(|state| *state)
                    .unwrap_or(true);

                if minimize_to_tray {
                    // 阻止默认的关闭行为并隐藏窗口到系统托盘
                    api.prevent_close();
                    let _ = window.hide();
                } else {
                    // 阻止默认关闭行为，先停止所有隧道进程
                    api.prevent_close();

                    // 获取进程管理器并停止所有隧道
                    let app_handle = window.app_handle();
                    let process_manager = app_handle.state::<ProcessManager>();

                    // 克隆必要的数据以避免生命周期问题
                    let app_handle_clone = app_handle.clone();
                    let process_manager_clone = process_manager.inner().clone();

                    // 在新线程中处理隧道停止和应用退出
                    std::thread::spawn(move || {
                        // 停止所有正在运行的隧道
                        if let Ok(manager) = process_manager_clone.lock() {
                            let running_tunnels: Vec<i32> = manager.keys().cloned().collect();
                            drop(manager); // 释放锁

                            // 逐个停止隧道
                            for proxy_id in running_tunnels {
                                if let Ok(mut manager) = process_manager_clone.lock() {
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
                        }

                        // 等待一小段时间确保所有进程都已停止
                        std::thread::sleep(std::time::Duration::from_millis(200));

                        // 退出应用
                        app_handle_clone.exit(0);
                    });
                }
            }
        })
        .manage(process_manager)
        .manage(webui_manager)
        .manage(minimize_to_tray_state)
        .invoke_handler(tauri::generate_handler![
            api_get_traffic_stats,
            api_get_system_notification,
            api_get_tunnel_logs,
            api_get_running_tunnels,
            api_start_tunnel,
            api_stop_tunnel,
            save_config_file,
            delete_config_file,
            check_tunnel_config_files,
            save_unified_config,
            load_unified_config,
            set_auto_start,
            is_auto_start_enabled,
            set_always_on_top,
            set_minimize_to_tray,
            quit_app,
            get_app_version,
            check_for_updates,
            get_update_history,
            download_and_install_update,
            fetch_privacy_policy,
            copy_background_image_to_temp,
            remove_managed_background_image,
            resolve_managed_background_image_path,
            read_managed_background_image_data_url,
            api_send_feedback,
            start_webui,
            stop_webui,
            is_webui_running,
            get_webui_logs,
            open_url,
            open_webview_window,
            close_webview_window,
            webui_login,
            webui_get_tunnels,
            webui_start_tunnel,
            webui_stop_tunnel,
            api_analyze_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    }