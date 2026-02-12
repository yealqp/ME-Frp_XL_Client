//! 配置相关数据结构
//!
//! 本模块定义了应用配置相关的数据结构，包括统一配置、应用设置等。
//! 优化后的配置结构移除了冗余字段（api_status, theme, login_time, user_info），
//! 并将 user_info.group 提升到顶层作为 group 字段。

use super::auth::UserInfo;
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
        }
    }
}

/// 应用设置结构体
///
/// 用于管理应用的各项设置，包括自动启动、窗口置顶、自动更新等
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSettings {
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
    pub theme: String,
    #[serde(rename = "minimizeToTray")]
    pub minimize_to_tray: bool,
    #[serde(rename = "showAd")]
    pub show_ad: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            auto_start: false,
            always_on_top: false,
            auto_update: true,
            auto_start_tunnels: Vec::new(),
            startup_delay: 5,
            theme: "dark".to_string(),
            minimize_to_tray: true,
            show_ad: true,
        }
    }
}

/// 旧的配置结构体（保留用于向后兼容和配置迁移）
///
/// 此结构体用于读取旧格式的配置文件，并迁移到新的 UnifiedConfig 格式
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    pub api_status: String,
    pub login_time: String,
    pub user_token: String,
    pub frp_token: String,
    pub username: String,
    pub user_info: UserInfo,
}
