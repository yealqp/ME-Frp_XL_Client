/// 隧道相关数据结构模块
///
/// 包含隧道进程信息和各种隧道操作请求的结构体定义
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Child;
use std::sync::{Arc, Mutex};

/// 隧道进程信息
///
/// 存储单个隧道进程的运行状态、子进程句柄和日志信息
#[derive(Debug, Clone)]
pub struct TunnelProcess {
    #[allow(dead_code)]
    pub proxy_id: i32,
    pub child: Arc<Mutex<Option<Child>>>,
    pub logs: Arc<Mutex<Vec<String>>>,
}

/// 全局进程管理器类型别名
///
/// 用于管理所有运行中的隧道进程，Key为proxy_id，Value为TunnelProcess
pub type ProcessManager = Arc<Mutex<HashMap<i32, TunnelProcess>>>;

/// 创建隧道请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct CreateTunnelRequest {
    #[serde(rename = "nodeId")]
    pub node_id: i32,
    #[serde(rename = "proxyName")]
    pub proxy_name: String,
    #[serde(rename = "localIp")]
    pub local_ip: String,
    #[serde(rename = "localPort")]
    pub local_port: i32,
    #[serde(rename = "remotePort")]
    pub remote_port: Option<i32>,
    pub domain: String,
    #[serde(rename = "proxyType")]
    pub proxy_type: String,
    #[serde(rename = "accessKey")]
    pub access_key: String,
    #[serde(rename = "hostHeaderRewrite")]
    pub host_header_rewrite: String,
    #[serde(rename = "headerXFromWhere")]
    pub header_x_from_where: String,
    #[serde(rename = "proxyProtocolVersion")]
    pub proxy_protocol_version: String,
    #[serde(rename = "useEncryption")]
    pub use_encryption: bool,
    #[serde(rename = "useCompression")]
    pub use_compression: bool,
}

/// 更新隧道请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateTunnelRequest {
    #[serde(rename = "proxyId")]
    pub proxy_id: i32,
    #[serde(rename = "proxyName")]
    pub proxy_name: String,
    #[serde(rename = "localIp")]
    pub local_ip: String,
    #[serde(rename = "localPort")]
    pub local_port: i32,
    #[serde(rename = "remotePort")]
    pub remote_port: Option<i32>,
    pub domain: String,
    pub location: String,
    #[serde(rename = "accessKey")]
    pub access_key: String,
    #[serde(rename = "hostHeaderRewrite")]
    pub host_header_rewrite: String,
    #[serde(rename = "headerXFromWhere")]
    pub header_x_from_where: String,
    #[serde(rename = "useEncryption")]
    pub use_encryption: bool,
    #[serde(rename = "useCompression")]
    pub use_compression: bool,
    #[serde(rename = "proxyProtocolVersion")]
    pub proxy_protocol_version: String,
    #[serde(rename = "proxyType")]
    pub proxy_type: String,
    #[serde(rename = "nodeId")]
    pub node_id: i32,
}

/// 删除隧道请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct DeleteTunnelRequest {
    #[serde(rename = "proxyId")]
    pub proxy_id: i32,
}

/// 强制下线隧道请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct KickTunnelRequest {
    #[serde(rename = "proxyId")]
    pub proxy_id: i32,
}

/// 启用/禁用隧道请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct ToggleTunnelRequest {
    #[serde(rename = "proxyId")]
    pub proxy_id: i32,
    #[serde(rename = "isDisabled")]
    pub is_disabled: bool,
}

/// 获取隧道配置文件请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct TunnelConfigRequest {
    #[serde(rename = "proxyId")]
    pub proxy_id: i32,
    pub format: String,
}

/// 获取空闲端口请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct FreePortRequest {
    #[serde(rename = "nodeId")]
    pub node_id: i32,
    pub protocol: String,
}
