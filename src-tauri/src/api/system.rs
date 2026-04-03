//! 系统相关API模块
//!
//! 本模块封装所有系统相关的HTTP API请求，包括：
//! - get_announcements: 获取系统公告
//! - get_system_status: 获取系统状态
//! - get_popup_notice: 获取弹窗公告
//! - get_traffic_stats: 获取流量统计
//! - get_operation_logs: 获取操作日志
//! - api_request: 通用API请求

use crate::models::api::ApiResponse;
use crate::utils::create_http_client;

/// 获取系统公告
///
/// # 参数
/// - token: 用户认证token
///
/// # 返回
/// 成功返回公告内容字符串
pub async fn get_announcements(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/auth/notice")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取系统公告请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取系统公告失败，状态码: {}", response.status()));
    }

    // 尝试解析为字符串响应
    let api_response: ApiResponse<String> = response
        .json()
        .await
        .map_err(|e| format!("解析系统公告响应失败: {e}"))?;

    if api_response.code != 200 {
        return Err(format!("获取系统公告失败: {}", api_response.message));
    }

    Ok(api_response.data.unwrap_or_default())
}

/// 获取系统状态
///
/// # 参数
/// - token: 用户认证token
///
/// # 返回
/// 成功返回系统状态JSON字符串
pub async fn get_system_status(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/auth/system/status")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取系统状态请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取系统状态失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析系统状态响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取弹窗公告
///
/// # 参数
/// - token: 用户认证token
///
/// # 返回
/// 成功返回弹窗公告JSON字符串
pub async fn get_popup_notice(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/auth/popupNotice")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取弹窗公告请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取弹窗公告失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析弹窗公告响应失败: {e}"))?;

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

    let response = client
        .post("https://api.mefrp.com/api/auth/user/trafficStats")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "datePeriod": date_period
        }))
        .send()
        .await
        .map_err(|e| format!("获取流量统计请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取流量统计失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析流量统计响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取操作日志
///
/// # 参数
/// - token: 用户认证token
/// - params: 查询参数JSON字符串
///
/// # 返回
/// 成功返回操作日志JSON字符串
pub async fn get_operation_logs(token: &str, params: &str) -> Result<String, String> {
    // 解析参数
    let params_json: serde_json::Value =
        serde_json::from_str(params).map_err(|e| format!("解析参数失败: {e}"))?;

    // 构建查询参数
    let mut query_params = vec![
        format!("page={}", params_json["page"].as_i64().unwrap_or(1)),
        format!(
            "pageSize={}",
            params_json["pageSize"].as_i64().unwrap_or(20)
        ),
    ];

    // 添加可选参数
    if let Some(category) = params_json["category"].as_str() {
        query_params.push(format!("category={category}"));
    }
    if let Some(status) = params_json["status"].as_str() {
        query_params.push(format!("status={status}"));
    }
    if let Some(start_time) = params_json["startTime"].as_str() {
        query_params.push(format!("startTime={start_time}"));
    }
    if let Some(end_time) = params_json["endTime"].as_str() {
        query_params.push(format!("endTime={end_time}"));
    }

    let query_string = query_params.join("&");
    let url = format!("https://api.mefrp.com/api/auth/operationLog/list?{query_string}");

    let client = create_http_client();
    let response = client
        .get(&url)
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取操作日志请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取操作日志失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析操作日志响应失败: {e}"))?;

    Ok(response_text)
}

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

    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("API请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("API请求失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析API响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取统计信息（公开API，无需token）
///
/// # 返回
/// 成功返回统计信息JSON字符串
pub async fn get_statistics() -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/public/statistics")
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取统计信息请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取统计信息失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析统计信息响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取系统通知（公开API，无需token）
///
/// # 返回
/// 成功返回系统通知文本内容
pub async fn get_system_notification() -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://check.yealqp.cn/notification.txt")
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
