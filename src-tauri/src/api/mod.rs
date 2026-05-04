//! API请求封装模块
//!
//! 本模块封装非 api.mefrp.com 的HTTP API请求：
//! - client: HTTP客户端创建和配置
//! - feedback: 反馈相关API（NapCat QQ bot）
//! - system: 系统相关API（通用请求 + 系统通知）

pub mod client;
pub mod feedback;
pub mod system;

// 重导出常用API函数

// 客户端相关
pub use client::{create_http_client, CURRENT_VERSION};

// 系统相关
pub use system::{api_request, get_system_notification, get_traffic_stats};
