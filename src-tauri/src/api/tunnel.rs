//! 隧道API模块
//!
//! 提供隧道相关的API请求功能，包括创建、获取、更新、删除、强制下线、切换状态和获取配置

use crate::api::client::{create_http_client, send_text_request, with_bearer_auth};
use crate::models::tunnel::{
    CreateTunnelRequest, DeleteTunnelRequest, KickTunnelRequest, ToggleTunnelRequest,
    TunnelConfigRequest, UpdateTunnelRequest,
};

/// 创建隧道
///
/// # 参数
/// * `token` - 用户认证token
/// * `request` - 创建隧道请求数据
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn create_tunnel(token: &str, request: &CreateTunnelRequest) -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/proxy/create"), token)
            .json(request),
        "创建隧道请求失败",
        "创建隧道失败",
        "解析创建隧道响应失败",
    )
    .await
}

/// 获取隧道列表
///
/// # 参数
/// * `token` - 用户认证token
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn get_tunnel_list(token: &str) -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.get("https://api.mefrp.com/api/auth/proxy/list"), token),
        "获取隧道列表请求失败",
        "获取隧道列表失败",
        "解析隧道列表响应失败",
    )
    .await
}

/// 更新隧道
///
/// # 参数
/// * `token` - 用户认证token
/// * `request` - 更新隧道请求数据
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn update_tunnel(token: &str, request: &UpdateTunnelRequest) -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/proxy/update"), token)
            .json(request),
        "编辑隧道请求失败",
        "编辑隧道失败",
        "解析编辑隧道响应失败",
    )
    .await
}

/// 删除隧道
///
/// # 参数
/// * `token` - 用户认证token
/// * `proxy_id` - 隧道ID
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn delete_tunnel(token: &str, proxy_id: i32) -> Result<String, String> {
    let delete_request = DeleteTunnelRequest { proxy_id };

    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/proxy/delete"), token)
            .json(&delete_request),
        "删除隧道请求失败",
        "删除隧道失败",
        "解析删除隧道响应失败",
    )
    .await
}

/// 强制下线隧道
///
/// # 参数
/// * `token` - 用户认证token
/// * `proxy_id` - 隧道ID
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn kick_tunnel(token: &str, proxy_id: i32) -> Result<String, String> {
    let kick_request = KickTunnelRequest { proxy_id };

    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/proxy/kick"), token)
            .json(&kick_request),
        "强制下线隧道请求失败",
        "强制下线隧道失败",
        "解析强制下线隧道响应失败",
    )
    .await
}

/// 强制下线所有隧道
///
/// # 参数
/// * `token` - 用户认证token
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn kick_all_proxies(token: &str) -> Result<String, String> {
    let client = create_http_client();

    send_text_request(
        with_bearer_auth(
            client.get("https://api.mefrp.com/api/auth/user/kickAllProxies"),
            token,
        ),
        "强制下线所有隧道请求失败",
        "强制下线所有隧道失败",
        "解析强制下线所有隧道响应失败",
    )
    .await
}

/// 切换隧道状态（启用/禁用）
///
/// # 参数
/// * `token` - 用户认证token
/// * `proxy_id` - 隧道ID
/// * `is_disabled` - 是否禁用
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn toggle_tunnel(
    token: &str,
    proxy_id: i32,
    is_disabled: bool,
) -> Result<String, String> {
    let toggle_request = ToggleTunnelRequest {
        proxy_id,
        is_disabled,
    };

    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/proxy/toggle"), token)
            .json(&toggle_request),
        "切换隧道状态请求失败",
        "切换隧道状态失败",
        "解析切换隧道状态响应失败",
    )
    .await
}

/// 获取隧道配置文件
///
/// # 参数
/// * `token` - 用户认证token
/// * `proxy_id` - 隧道ID
/// * `format` - 配置文件格式（toml, json, yml, ini）
///
/// # 返回
/// * `Ok(String)` - API响应文本
/// * `Err(String)` - 错误信息
pub async fn get_tunnel_config(
    token: &str,
    proxy_id: i32,
    format: String,
) -> Result<String, String> {
    let request_data = TunnelConfigRequest { proxy_id, format };

    let client = create_http_client();

    send_text_request(
        with_bearer_auth(client.post("https://api.mefrp.com/api/auth/proxy/config"), token)
            .json(&request_data),
        "获取隧道配置文件请求失败",
        "获取隧道配置文件失败",
        "解析隧道配置文件响应失败",
    )
    .await
}
