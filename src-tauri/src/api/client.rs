//! HTTP客户端模块
//!
//! 提供HTTP客户端创建和版本信息

// 从 utils 模块导入 HTTP 客户端创建函数和版本常量
pub use crate::utils::http::{create_http_client, CURRENT_VERSION};
