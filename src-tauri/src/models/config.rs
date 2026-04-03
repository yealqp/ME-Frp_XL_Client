//! 配置相关数据结构
//!
//! 本模块定义了应用配置相关的数据结构，包括统一配置等。
//! 优化后的配置结构移除了冗余字段（api_status, theme, login_time, user_info），
//! 并将 user_info.group 提升到顶层作为 group 字段。

use serde::{Deserialize, Serialize};

/// 统一配置结构体（优化后）
///
/// 移除了以下冗余字段：
/// - api_status: 不需要持久化的运行时状态
/// - theme: 前端主题设置，不需要后端管理
/// - login_time: 不需要持久化的登录时间
/// - user_info: 简化为顶层 group 字段
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UnifiedConfig {
    // 登录相关配置
    #[serde(rename = "userToken")]
    pub user_token: String,
    #[serde(rename = "frpToken")]
    pub frp_token: String,
    pub username: String,
    pub group: String,

    // 应用设置
    #[serde(rename = "autoStart")]
    pub auto_start: bool,
    #[serde(rename = "alwaysOnTop")]
    pub always_on_top: bool,
    #[serde(rename = "autoUpdate")]
    pub auto_update: bool,
    #[serde(rename = "autoStartTunnels")]
    pub auto_start_tunnels: Vec<i32>,
    #[serde(rename = "startupDelay")]
    pub startup_delay: i32,
    #[serde(rename = "minimizeToTray")]
    pub minimize_to_tray: bool,
    #[serde(rename = "showAd")]
    pub show_ad: bool,
    #[serde(rename = "hideWebuiEntry")]
    pub hide_webui_entry: bool,
    
    // UI 设置
    #[serde(rename = "sidebarWidth", skip_serializing_if = "Option::is_none")]
    pub sidebar_width: Option<i32>,
    #[serde(rename = "sidebarCollapsible", skip_serializing_if = "Option::is_none")]
    pub sidebar_collapsible: Option<bool>,
    #[serde(rename = "sidebarCollapsed", skip_serializing_if = "Option::is_none")]
    pub sidebar_collapsed: Option<bool>,

    // WebUI 设置
    #[serde(rename = "webuiAddr", skip_serializing_if = "Option::is_none")]
    pub webui_addr: Option<String>,
    #[serde(rename = "webuiPort", skip_serializing_if = "Option::is_none")]
    pub webui_port: Option<u16>,
    #[serde(rename = "webuiPass", skip_serializing_if = "Option::is_none")]
    pub webui_pass: Option<String>,

    // 主题设置
    #[serde(rename = "themeMode", skip_serializing_if = "Option::is_none")]
    pub theme_mode: Option<String>,
}

impl Default for UnifiedConfig {
    fn default() -> Self {
        Self {
            // 登录相关默认值
            user_token: String::new(),
            frp_token: String::new(),
            username: String::new(),
            group: String::new(),

            // 应用设置默认值
            auto_start: false,
            always_on_top: false,
            auto_update: true,
            auto_start_tunnels: Vec::new(),
            startup_delay: 5,
            minimize_to_tray: true,
            show_ad: true,
            hide_webui_entry: false,
            
            // UI 设置默认值
            sidebar_width: Some(200),
            sidebar_collapsible: Some(true),
            sidebar_collapsed: Some(false),

            // WebUI 设置默认值
            webui_addr: Some("localhost".to_string()),
            webui_port: Some(1201),
            webui_pass: Some("admin".to_string()),

            // 主题设置默认值
            theme_mode: None,
        }
    }
}
