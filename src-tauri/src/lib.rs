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
use tauri::Manager;

// 模块声明
pub mod api;
pub mod commands;
pub mod config;
pub mod models;
pub mod system;
pub mod tunnel;
pub mod utils;
pub mod webui;

use tunnel::ProcessManager;

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

            system::window::setup_tray(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                system::window::handle_close_requested(window, api);
            }
        })
        .manage(process_manager)
        .manage(webui_manager)
        .manage(minimize_to_tray_state)
        .invoke_handler(tauri::generate_handler![
            commands::api::api_get_traffic_stats,
            commands::api::api_get_system_notification,
            commands::tunnel::api_get_tunnel_logs,
            commands::tunnel::api_get_running_tunnels,
            commands::tunnel::api_start_tunnel,
            commands::tunnel::api_stop_tunnel,
            commands::tunnel::save_config_file,
            commands::tunnel::delete_config_file,
            commands::tunnel::check_tunnel_config_files,
            commands::config::save_unified_config,
            commands::config::load_unified_config,
            commands::system::set_auto_start,
            commands::system::is_auto_start_enabled,
            commands::system::set_always_on_top,
            commands::system::set_minimize_to_tray,
            commands::system::quit_app,
            commands::system::get_app_version,
            commands::api::check_for_updates,
            commands::api::get_update_history,
            commands::system::download_and_install_update,
            commands::api::fetch_privacy_policy,
            commands::system::copy_background_image_to_temp,
            commands::system::remove_managed_background_image,
            commands::system::resolve_managed_background_image_path,
            commands::system::read_managed_background_image_data_url,
            commands::api::api_send_feedback,
            commands::api::api_report_analysis,
            commands::webui::start_webui,
            commands::webui::stop_webui,
            commands::webui::is_webui_running,
            commands::webui::get_webui_logs,
            commands::system::open_url,
            commands::system::open_webview_window,
            commands::system::close_webview_window,
            commands::webui::webui_login,
            commands::webui::webui_get_tunnels,
            commands::webui::webui_start_tunnel,
            commands::webui::webui_stop_tunnel,
            commands::api::api_analyze_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    }