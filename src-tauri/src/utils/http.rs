//! HTTP工具函数模块
//!
//! 提供HTTP客户端创建和版本管理功能

use reqwest;

/// 当前应用版本 - 从 Cargo.toml 读取
pub const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

/// 创建带有统一 User-Agent 的 HTTP 客户端
///
/// 返回配置了统一 User-Agent 的 reqwest 客户端实例
/// User-Agent 格式: MeFrp-XL/{version}
pub fn create_http_client() -> reqwest::Client {
    let user_agent = format!("MeFrp-XL/{CURRENT_VERSION}");
    reqwest::Client::builder()
        .user_agent(user_agent)
        .build()
        .expect("Failed to create HTTP client")
}
