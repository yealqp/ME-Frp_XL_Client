//! API请求封装模块
//!
//! 本模块封装所有HTTP API请求，包括：
//! - client: HTTP客户端创建和配置
//! - auth: 认证相关API
//! - tunnel: 隧道相关API
//! - node: 节点相关API
//! - system: 系统相关API
//! - feedback: 反馈相关API

pub mod auth;
pub mod client;
pub mod feedback;
pub mod node;
pub mod system;
pub mod tunnel;

// 重导出常用API函数

// 客户端相关
pub use client::{create_http_client, CURRENT_VERSION};

// 认证相关
pub use auth::{get_cdk_history, get_frp_token, get_user_info, login, redeem_cdk, user_sign};

// 隧道相关
pub use tunnel::{
    create_tunnel, delete_tunnel, get_tunnel_config, get_tunnel_list, kick_all_proxies,
    kick_tunnel, toggle_tunnel, update_tunnel,
};

// 节点相关
pub use node::{get_free_port, get_node_list, get_node_name_list, get_node_status};

// 系统相关
pub use system::{
    api_request, get_announcements, get_operation_logs, get_popup_notice, get_system_status,
    get_traffic_stats,
};

// 反馈相关
pub use feedback::send_feedback;
