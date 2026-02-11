//! API响应相关数据结构
//!
//! 本模块定义了与API响应相关的数据结构，包括：
//! - ApiResponse: 通用API响应结构体
//! - RemoteVersion: 远程版本信息
//! - VersionCheckResult: 版本检查结果
//! - FrpTokenData: FRP Token数据

use serde::{Deserialize, Serialize};

/// 通用API响应结构体
///
/// 用于封装所有API请求的响应数据
#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T> {
    /// 响应状态码
    pub code: i32,
    /// 响应数据（可选）
    pub data: Option<T>,
    /// 响应消息
    pub message: String,
}

/// 远程版本信息结构体
///
/// 用于存储从远程服务器获取的版本信息
#[derive(Serialize, Deserialize, Debug)]
pub struct RemoteVersion {
    /// 版本号
    pub version: String,
    /// 更新信息列表
    #[serde(default)]
    pub updateinfo: Vec<String>,
}

/// 版本检查结果结构体
///
/// 用于存储版本检查的结果信息
#[derive(Serialize, Deserialize, Debug)]
pub struct VersionCheckResult {
    /// 当前版本号
    pub current_version: String,
    /// 最新版本号
    pub latest_version: String,
    /// 是否有更新
    pub has_update: bool,
    /// 更新信息列表
    pub update_info: Vec<String>,
}

/// FRP Token数据结构体
///
/// 用于存储FRP Token响应数据
#[derive(Serialize, Deserialize, Debug)]
pub struct FrpTokenData {
    /// FRP Token字符串
    pub token: String,
}
