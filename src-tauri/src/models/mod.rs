//! 数据结构定义模块
//!
//! 本模块包含应用中使用的所有数据结构定义，按功能分组：
//! - api: API响应和版本信息结构体
//! - config: 配置相关结构体
//! - tunnel: 隧道进程管理结构体

pub mod api;
pub mod config;
pub mod tunnel;

// 重导出常用类型
pub use api::{FrpTokenData, RemoteVersion, VersionCheckResult};
pub use config::UnifiedConfig;
pub use tunnel::{ProcessManager, TunnelProcess};
