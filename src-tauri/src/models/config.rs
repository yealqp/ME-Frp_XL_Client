//! 配置相关数据结构
//!
//! 本模块定义了应用配置相关的数据结构，包括统一配置等。
//! 优化后的配置结构移除了冗余字段（api_status, theme, login_time, user_info），
//! 并将 user_info.group 提升到顶层作为 group 字段。

use serde::{Deserialize, Serialize};
use serde_json::Value;

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
    #[serde(rename = "hideWebuiEntry")]
    pub hide_webui_entry: bool,
    #[serde(rename = "enableAi", default)]
    pub enable_ai: bool,

    // UI 设置
    #[serde(rename = "sidebarWidth", skip_serializing_if = "Option::is_none")]
    pub sidebar_width: Option<i32>,
    #[serde(rename = "sidebarCollapsible", skip_serializing_if = "Option::is_none")]
    pub sidebar_collapsible: Option<bool>,
    #[serde(rename = "sidebarCollapsed", skip_serializing_if = "Option::is_none")]
    pub sidebar_collapsed: Option<bool>,
    #[serde(
        rename = "backgroundImagePath",
        skip_serializing_if = "Option::is_none"
    )]
    pub background_image_path: Option<String>,
    #[serde(
        rename = "backgroundImageOpacity",
        skip_serializing_if = "Option::is_none"
    )]
    pub background_image_opacity: Option<u8>,
    #[serde(rename = "backgroundBlur", skip_serializing_if = "Option::is_none")]
    pub background_blur: Option<u8>,
    #[serde(rename = "sidebarOpacity", skip_serializing_if = "Option::is_none")]
    pub sidebar_opacity: Option<u8>,
    #[serde(rename = "contentOpacity", skip_serializing_if = "Option::is_none")]
    pub content_opacity: Option<u8>,
    #[serde(rename = "fontWeight", skip_serializing_if = "Option::is_none")]
    pub font_weight: Option<u16>,
    #[serde(rename = "shadowIntensity", skip_serializing_if = "Option::is_none")]
    pub shadow_intensity: Option<u8>,
    #[serde(rename = "sidebarPosition", skip_serializing_if = "Option::is_none")]
    pub sidebar_position: Option<String>,

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
    #[serde(rename = "themeCustomization", skip_serializing_if = "Option::is_none")]
    pub theme_customization: Option<Value>,
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
            hide_webui_entry: false,
            enable_ai: false,

            // UI 设置默认值
            sidebar_width: Some(200),
            sidebar_collapsible: Some(true),
            sidebar_collapsed: Some(false),
            background_image_path: None,
            background_image_opacity: Some(100),
            background_blur: Some(0),
            sidebar_opacity: Some(100),
            content_opacity: Some(100),
            font_weight: Some(400),
            shadow_intensity: Some(100),
            sidebar_position: Some("left".to_string()),

            // WebUI 设置默认值
            webui_addr: Some("localhost".to_string()),
            webui_port: Some(1201),
            webui_pass: Some("admin".to_string()),

            // 主题设置默认值
            theme_mode: None,
            theme_customization: None,
        }
    }
}
