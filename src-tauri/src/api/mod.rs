//! API请求封装模块
//!
//! 本模块封装非 api.mefrp.com 的HTTP API请求：
//! - client: HTTP客户端创建和配置
//! - feedback: 反馈相关API（NapCat QQ bot）
//! - analysis: 用户统计上报 API
//! - system: 系统相关API（系统通知 + 流量统计）
//! - ai_analysis: AI 日志分析（OpenAI 兼容 API）

pub mod ai_analysis;
pub mod analysis;
pub mod client;
pub mod feedback;
pub mod system;

// 重导出常用API函数

// 客户端相关
pub use client::{create_http_client, CURRENT_VERSION};

// 系统相关
pub use system::{get_system_notification, get_traffic_stats};
