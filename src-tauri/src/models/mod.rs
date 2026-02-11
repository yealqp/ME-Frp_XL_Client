//! 数据结构定义模块
//!
//! 本模块包含应用中使用的所有数据结构定义，按功能分组：
//! - auth: 认证相关结构体
//! - tunnel: 隧道相关结构体
//! - config: 配置相关结构体
//! - api: API响应结构体

pub mod api;
pub mod auth;
pub mod config;
pub mod tunnel;

// 重导出常用类型
pub use api::{ApiResponse, FrpTokenData, RemoteVersion, VersionCheckResult};
pub use auth::{LoginData, LoginRequest, UserDetailInfo, UserInfo};
pub use config::{AppSettings, Config, UnifiedConfig};
pub use tunnel::{
    CreateTunnelRequest, DeleteTunnelRequest, FreePortRequest, KickTunnelRequest, ProcessManager,
    ToggleTunnelRequest, TunnelConfigRequest, TunnelProcess, UpdateTunnelRequest,
};
