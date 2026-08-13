//! 系统相关API模块
//!
//! 本模块封装HTTP API请求：
//! - get_system_notification: 获取系统通知（xlc.mefrp.yealqp.cn）
//! - get_traffic_stats: 获取流量统计（api.mefrp.com，保留在后端以绕过CORS）
//! - fetch_privacy_policy: 获取隐私政策（xlc.mefrp.yealqp.cn）

use crate::api::client::{create_http_client, send_text_request, with_bearer_auth};

/// 获取流量统计
///
/// # 参数
/// - token: 用户认证token
/// - date_period: 日期周期
///
/// # 返回
/// 成功返回流量统计JSON字符串
pub async fn get_traffic_stats(token: &str, date_period: u32) -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        with_bearer_auth(
            client.post("https://api.mefrp.com/api/auth/user/trafficStats"),
            token,
        )
        .json(&serde_json::json!({
            "datePeriod": date_period
        })),
        "获取流量统计请求失败",
        "获取流量统计失败",
        "解析流量统计响应失败",
    )
    .await
}

/// 获取系统通知（公开API，无需token）
///
/// # 返回
/// 成功返回系统通知文本内容
pub async fn get_system_notification() -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://xlc.mefrp.yealqp.cn/notification.txt")
        .send()
        .await
        .map_err(|e| format!("获取系统通知请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取系统通知失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析系统通知响应失败: {e}"))?;

    Ok(response_text)
}

pub async fn fetch_privacy_policy() -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        client.get("https://xlc.mefrp.yealqp.cn/privacy.md"),
        "请求隐私政策失败",
        "获取隐私政策失败",
        "读取隐私政策内容失败",
    )
    .await
}
