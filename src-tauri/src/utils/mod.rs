//! 工具函数模块
//!
//! 本模块提供通用工具函数，可被其他模块复用

pub mod http;
pub mod process;

// 重导出常用工具函数
pub use http::{create_http_client, CURRENT_VERSION};
