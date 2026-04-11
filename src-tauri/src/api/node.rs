//! 节点相关API
//!
//! 本模块封装所有节点相关的API请求，包括：
//! - 获取节点列表
//! - 获取节点状态
//! - 获取节点简要信息
//! - 获取空闲端口

use crate::api::client::{create_http_client, send_text_request, with_bearer_auth};
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

    send_text_request(
        with_bearer_auth(client.get("https://api.mefrp.com/api/auth/node/list"), token),
        "获取节点列表请求失败",
        "获取节点列表失败",
        "解析节点列表响应失败",
    )
    .await
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

    send_text_request(
        with_bearer_auth(client.get("https://api.mefrp.com/api/auth/node/status"), token),
        "获取节点状态请求失败",
        "获取节点状态失败",
        "解析节点状态响应失败",
    )
    .await
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

    send_text_request(
        with_bearer_auth(client.get("https://api.mefrp.com/api/auth/node/nameList"), token),
        "获取节点简要信息请求失败",
        "获取节点简要信息失败",
        "解析节点简要信息响应失败",
    )
    .await
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

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/node/freePort"), token)
            .json(&serde_json::json!({
                "nodeId": request.node_id,
                "protocol": request.protocol
            })),
        "获取空闲端口请求失败",
        "获取空闲端口失败",
        "解析空闲端口响应失败",
    )
    .await
}

/// 获取创建隧道所需的所有数据
///
/// # 参数
/// * `token` - 用户认证token
///
/// # 返回
/// * `Ok(String)` - 包含节点列表、用户组信息和当前用户组的JSON字符串
/// * `Err(String)` - 错误信息
pub async fn get_create_proxy_data(token: &str) -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        with_bearer_auth(
            client.get("https://api.mefrp.com/api/auth/createProxyData"),
            token,
        ),
        "获取创建隧道数据请求失败",
        "获取创建隧道数据失败",
        "解析创建隧道数据响应失败",
    )
    .await
}
