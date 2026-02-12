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
use std::sync::{Arc, Mutex};
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

// 导入模块中的类型
use models::api::VersionCheckResult;
use models::auth::{UserDetailInfo, UserInfo};
use models::config::{AppSettings, Config, UnifiedConfig};
use models::tunnel::{CreateTunnelRequest, FreePortRequest, UpdateTunnelRequest};
use tunnel::ProcessManager;

#[tauri::command]
async fn save_config(_app_handle: tauri::AppHandle, config: Config) -> Result<String, String> {
    config::save_config(&config).await?;
    Ok("Config saved successfully".to_string())
}

#[tauri::command]
async fn read_config(_app_handle: tauri::AppHandle) -> Result<Option<Config>, String> {
    config::read_config().await
}

#[tauri::command]
async fn clear_config(_app_handle: tauri::AppHandle) -> Result<String, String> {
    config::clear_config().await?;
    Ok("Config cleared successfully".to_string())
}

// 登录API命令
#[tauri::command]
async fn api_login(
    _app_handle: tauri::AppHandle,
    username: String,
    password: String,
    captcha_token: Option<String>,
) -> Result<Config, String> {
    // 调用api::auth模块的login函数
    let (user_token, frp_token, login_data) =
        api::auth::login(username.clone(), password, captcha_token).await?;

    // 加载当前统一配置（保留应用设置）
    let mut unified_config = config::load_unified_config().await.unwrap_or_default();

    // 更新登录相关信息（使用新的优化结构）
    unified_config.user_token = user_token.clone();
    unified_config.frp_token = frp_token.clone();
    unified_config.username = username.clone();
    unified_config.group = login_data.group.clone();

    // 保存统一配置
    config::save_unified_config(&unified_config).await?;

    // 返回兼容的Config结构体（用于前端）
    let config = Config {
        api_status: "connected".to_string(),
        login_time: chrono::Utc::now().to_rfc3339(),
        user_token: user_token.clone(),
        frp_token: frp_token.clone(),
        username: username.clone(),
        user_info: UserInfo {
            group: Some(login_data.group),
            token: Some(user_token),
            username: Some(login_data.username),
        },
    };

    Ok(config)
}

// 获取用户信息API命令
#[tauri::command]
async fn api_get_user_info(_app_handle: tauri::AppHandle) -> Result<UserDetailInfo, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    // 调用api::auth模块的get_user_info函数
    api::auth::get_user_info(&config.user_token).await
}

// 用户签到API命令
#[tauri::command]
async fn api_user_sign(
    _app_handle: tauri::AppHandle,
    captcha_token: String,
) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    // 调用api::auth模块的user_sign函数
    api::auth::user_sign(&config.user_token, captcha_token).await
}

// CDK兑换API命令
#[tauri::command]
async fn api_redeem_cdk(
    _app_handle: tauri::AppHandle,
    code: String,
    captcha_token: String,
) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    // 调用api::auth模块的redeem_cdk函数
    api::auth::redeem_cdk(&config.user_token, code, captcha_token).await
}

// 获取CDK兑换历史API命令
#[tauri::command]
async fn api_get_cdk_history(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    // 调用api::auth模块的get_cdk_history函数
    api::auth::get_cdk_history(&config.user_token).await
}

// 获取流量统计API命令
#[tauri::command]
async fn api_get_traffic_stats(
    _app_handle: tauri::AppHandle,
    date_period: u32,
) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::get_traffic_stats(&config.user_token, date_period).await
}

/**
 * 获取 FRP Token API 命令
 * 专门用于获取 frpToken，并自动更新到统一配置中
 */
#[tauri::command]
async fn api_get_frp_token(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    // 调用api::auth模块的get_frp_token函数
    let frp_token = api::auth::get_frp_token(&config.user_token).await?;

    // 更新统一配置中的frp_token
    let mut updated_config = config;
    updated_config.frp_token = frp_token.clone();

    // 保存更新后的配置
    config::save_unified_config(&updated_config).await?;

    Ok(frp_token)
}

// 获取系统公告API命令
#[tauri::command]
async fn api_get_announcements(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::get_announcements(&config.user_token).await
}

// 获取系统状态API命令
#[tauri::command]
async fn api_get_system_status(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::get_system_status(&config.user_token).await
}

// 获取弹窗公告API命令
#[tauri::command]
async fn api_get_popup_notice(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 从统一配置读取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::get_popup_notice(&config.user_token).await
}

// 获取节点列表API命令
#[tauri::command]
async fn api_get_node_list(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 读取配置获取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::node::get_node_list(&config.user_token).await
}

// 编辑隧道API命令
#[tauri::command]
async fn api_update_tunnel(_app_handle: tauri::AppHandle, data: String) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    let request_data: UpdateTunnelRequest =
        serde_json::from_str(&data).map_err(|e| format!("解析请求数据失败: {e}"))?;

    api::tunnel::update_tunnel(&config.user_token, &request_data).await
}

// 强制下线隧道API命令
#[tauri::command]
async fn api_kick_tunnel(_app_handle: tauri::AppHandle, proxy_id: i32) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::tunnel::kick_tunnel(&config.user_token, proxy_id).await
}

// 强制下线所有隧道API命令
#[tauri::command]
async fn api_kick_all_proxies(_app_handle: tauri::AppHandle) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::tunnel::kick_all_proxies(&config.user_token).await
}

// 启用/禁用隧道API命令
#[tauri::command]
async fn api_toggle_tunnel(
    _app_handle: tauri::AppHandle,
    proxy_id: i32,
    is_disabled: bool,
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::tunnel::toggle_tunnel(&config.user_token, proxy_id, is_disabled).await
}

// 获取节点简要信息API命令
#[tauri::command]
async fn api_get_node_name_list(_app_handle: tauri::AppHandle) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::node::get_node_name_list(&config.user_token).await
}

// 获取隧道日志
#[tauri::command]
async fn api_get_tunnel_logs(
    proxy_id: i32,
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<Vec<String>, String> {
    tunnel::get_tunnel_logs(proxy_id, process_manager.inner()).await
}

// 获取所有运行中的隧道
#[tauri::command]
async fn api_get_running_tunnels(
    process_manager: tauri::State<'_, ProcessManager>,
) -> Result<Vec<i32>, String> {
    tunnel::get_running_tunnels(process_manager.inner()).await
}

// 获取节点状态API命令
#[tauri::command]
async fn api_get_node_status(_app_handle: tauri::AppHandle) -> Result<String, String> {
    // 读取配置获取token
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::node::get_node_status(&config.user_token).await
}

// 获取空闲端口API命令
#[tauri::command]
async fn api_get_free_port(_app_handle: tauri::AppHandle, data: String) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    let request_data: FreePortRequest =
        serde_json::from_str(&data).map_err(|e| format!("解析请求数据失败: {e}"))?;

    api::node::get_free_port(&config.user_token, &request_data).await
}

// 创建隧道API命令
#[tauri::command]
async fn api_create_tunnel(_app_handle: tauri::AppHandle, data: String) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    let request_data: CreateTunnelRequest =
        serde_json::from_str(&data).map_err(|e| format!("解析请求数据失败: {e}"))?;

    api::tunnel::create_tunnel(&config.user_token, &request_data).await
}

// 获取隧道列表API命令
#[tauri::command]
async fn api_get_tunnel_list(_app_handle: tauri::AppHandle) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::tunnel::get_tunnel_list(&config.user_token).await
}

// 获取操作日志API命令
#[tauri::command]
async fn api_get_operation_logs(
    _app_handle: tauri::AppHandle,
    params: String,
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::system::get_operation_logs(&config.user_token, &params).await
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

// 删除隧道API命令
#[tauri::command]
async fn api_delete_tunnel(_app_handle: tauri::AppHandle, proxy_id: i32) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::tunnel::delete_tunnel(&config.user_token, proxy_id).await
}

// 获取隧道配置文件API命令
#[tauri::command]
async fn api_get_tunnel_config(
    _app_handle: tauri::AppHandle,
    proxy_id: i32,
    format: String,
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    api::tunnel::get_tunnel_config(&config.user_token, proxy_id, format).await
}

// 保存应用设置
#[tauri::command]
async fn save_settings(
    _app_handle: tauri::AppHandle,
    settings: AppSettings,
) -> Result<String, String> {
    config::save_settings(&settings).await?;
    Ok("设置保存成功".to_string())
}

// 加载应用设置
#[tauri::command]
async fn load_settings(_app_handle: tauri::AppHandle) -> Result<AppSettings, String> {
    config::load_settings().await
}

// 设置开机自启动
#[tauri::command]
async fn set_auto_start(enable: bool) -> Result<String, String> {
    system::startup::set_auto_start(enable).await
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

// 下载并安装更新
#[tauri::command]
async fn download_and_install_update(version: String) -> Result<String, String> {
    system::update::download_and_install_update(version).await
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
) -> Result<String, String> {
    let config = config::load_unified_config()
        .await
        .map_err(|_| "未找到配置文件")?;

    if config.user_token.is_empty() {
        return Err("未找到有效的token".to_string());
    }

    // 获取用户信息以获取 user_id 和 email
    let user_info = api::auth::get_user_info(&config.user_token)
        .await
        .map_err(|e| format!("获取用户信息失败: {}", e))?;

    api::feedback::send_feedback(
        &config.user_token,
        &content,
        user_info.user_id,
    )
    .await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let process_manager: ProcessManager = Arc::new(Mutex::new(HashMap::new()));
    let minimize_to_tray_state: Arc<Mutex<bool>> = Arc::new(Mutex::new(true)); // 默认开启最小化到托盘

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
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

            // 创建系统托盘菜单
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;

            // 创建系统托盘
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("ME-Frp XL客户端")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    if event.id().as_ref() == "quit" {
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
        .manage(minimize_to_tray_state)
        .invoke_handler(tauri::generate_handler![
            save_config,
            read_config,
            clear_config,
            api_login,
            api_get_user_info,
            api_user_sign,
            api_redeem_cdk,
            api_get_cdk_history,
            api_get_traffic_stats,
            api_get_frp_token,
            api_get_announcements,
            api_get_system_status,
            api_get_popup_notice,
            api_get_node_list,
            api_get_node_status,
            api_get_free_port,
            api_create_tunnel,
            api_get_tunnel_list,
            api_get_operation_logs,
            api_start_tunnel,
            api_stop_tunnel,
            api_delete_tunnel,
            api_update_tunnel,
            api_kick_tunnel,
            api_kick_all_proxies,
            api_toggle_tunnel,
            api_get_node_name_list,
            api_get_tunnel_logs,
            api_get_running_tunnels,
            api_get_tunnel_config,
            api_request,
            save_config_file,
            delete_config_file,
            check_tunnel_config_files,
            save_settings,
            load_settings,
            save_unified_config,
            load_unified_config,
            migrate_old_configs,
            set_auto_start,
            set_always_on_top,
            show_window,
            hide_window,
            set_minimize_to_tray,
            quit_app,
            get_app_version,
            check_for_updates,
            download_and_install_update,
            api_send_feedback
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
