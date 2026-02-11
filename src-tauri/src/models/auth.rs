//! 认证相关数据结构
//!
//! 本模块定义了用户认证、登录和用户信息相关的数据结构

use serde::{Deserialize, Serialize};

/// 用户信息结构体
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserInfo {
    pub group: Option<String>,
    pub token: Option<String>,
    pub username: Option<String>,
}

/// 登录请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    #[serde(rename = "vaptchaToken", skip_serializing_if = "Option::is_none")]
    pub vaptcha_token: Option<String>,
    #[serde(rename = "vaptchaServe", skip_serializing_if = "Option::is_none")]
    pub vaptcha_serve: Option<String>,
}

/// 登录响应数据结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct LoginData {
    pub token: String,
    pub username: String,
    pub group: String,
}

/// 用户详细信息结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct UserDetailInfo {
    pub email: String,
    #[serde(rename = "friendlyGroup")]
    pub friendly_group: String,
    pub group: String,
    #[serde(rename = "inBound")]
    pub in_bound: i64,
    #[serde(rename = "isRealname")]
    pub is_realname: bool,
    #[serde(rename = "maxProxies")]
    pub max_proxies: i32,
    #[serde(rename = "outBound")]
    pub out_bound: i64,
    #[serde(rename = "regTime")]
    pub reg_time: i64,
    pub status: i32,
    #[serde(rename = "todaySigned")]
    pub today_signed: bool,
    pub traffic: i64,
    #[serde(rename = "usedProxies")]
    pub used_proxies: i32,
    #[serde(rename = "userId")]
    pub user_id: i32,
    pub username: String,
}
