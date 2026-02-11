//! 节点相关API
//!
//! 本模块封装所有节点相关的API请求，包括：
//! - 获取节点列表
//! - 获取节点状态
//! - 获取节点简要信息
//! - 获取空闲端口

use crate::api::client::create_http_client;
use crate::models::tunnel::FreePortRequest;

/// 获取节点列表
///
/// # 参数
/// * `token` - 用户认证token
///
/// # 返回
/// * `Ok(String)` - 节点列表JSON字符串
/// * `Err(String)` - 错误信息
pub async fn get_node_list(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/auth/node/list")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取节点列表请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取节点列表失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析节点列表响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取节点状态
///
/// # 参数
/// * `token` - 用户认证token
///
/// # 返回
/// * `Ok(String)` - 节点状态JSON字符串
/// * `Err(String)` - 错误信息
pub async fn get_node_status(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/auth/node/status")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取节点状态请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取节点状态失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析节点状态响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取节点简要信息
///
/// # 参数
/// * `token` - 用户认证token
///
/// # 返回
/// * `Ok(String)` - 节点简要信息JSON字符串
/// * `Err(String)` - 错误信息
pub async fn get_node_name_list(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.com/api/auth/node/nameList")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取节点简要信息请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "获取节点简要信息失败，状态码: {}",
            response.status()
        ));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析节点简要信息响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取空闲端口
///
/// # 参数
/// * `token` - 用户认证token
/// * `request` - 空闲端口请求参数
///
/// # 返回
/// * `Ok(String)` - 空闲端口信息JSON字符串
/// * `Err(String)` - 错误信息
pub async fn get_free_port(token: &str, request: &FreePortRequest) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .post("https://api.mefrp.com/api/auth/node/freePort")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "nodeId": request.node_id,
            "protocol": request.protocol
        }))
        .send()
        .await
        .map_err(|e| format!("获取空闲端口请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取空闲端口失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析空闲端口响应失败: {e}"))?;

    Ok(response_text)
}
