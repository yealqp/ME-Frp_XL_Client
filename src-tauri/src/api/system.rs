//! 系统相关API模块
//!
//! 本模块封装HTTP API请求：
//! - api_request: 通用API请求（可转发到任意URL）
//! - get_system_notification: 获取系统通知（xlc.mefrp.yealqp.cn）
//! - get_traffic_stats: 获取流量统计（api.mefrp.com，保留在后端以绕过CORS）

use crate::api::client::{create_http_client, send_request, send_text_request, with_bearer_auth};

/// 通用API请求
///
/// # 参数
/// - token: 用户认证token
/// - method: HTTP方法（GET, POST, PUT, DELETE）
/// - url: 请求URL
/// - data: 请求数据（JSON字符串）
///
/// # 返回
/// 成功返回响应JSON字符串
pub async fn api_request(
    token: &str,
    method: String,
    url: String,
    data: String,
) -> Result<String, String> {
    let client = create_http_client();
    let mut request_builder = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        _ => return Err("不支持的HTTP方法".to_string()),
    };

    request_builder = request_builder
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json");

    if !data.is_empty() && (method.to_uppercase() == "POST" || method.to_uppercase() == "PUT") {
        request_builder = request_builder.body(data);
    }

    let response = send_request(request_builder, "API请求失败").await?;

    if !response.status().is_success() {
        return Err(format!("API请求失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析API响应失败: {e}"))?;

    Ok(response_text)
}

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
