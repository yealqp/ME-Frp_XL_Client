//! 认证相关API模块
//!
//! 本模块封装所有认证相关的HTTP API请求，包括：
//! - login: 用户登录
//! - get_user_info: 获取用户信息
//! - user_sign: 用户签到
//! - redeem_cdk: 兑换CDK
//! - get_frp_token: 获取FRP Token
//! - get_cdk_history: 获取CDK兑换历史

use crate::models::api::{ApiResponse, FrpTokenData};
use crate::models::auth::{LoginData, LoginRequest, UserDetailInfo};
use crate::utils::create_http_client;
use serde::{Deserialize, Serialize};

/// 注册请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    #[serde(rename = "emailCode")]
    pub email_code: String,
}

/// 邮箱验证码请求结构体
#[derive(Serialize, Deserialize, Debug)]
pub struct EmailCodeRequest {
    pub email: String,
    #[serde(rename = "captchaToken")]
    pub captcha_token: String,
}

/// 用户登录
///
/// # 参数
/// - username: 用户名
/// - password: 密码
/// - captcha_token: 验证码token（可选）
///
/// # 返回
/// 成功返回 (user_token, frp_token, login_data)
pub async fn login(
    username: String,
    password: String,
    captcha_token: Option<String>,
) -> Result<(String, String, LoginData), String> {
    let client = create_http_client();

    let login_request = LoginRequest {
        username: username.clone(),
        password,
        vaptcha_token: captcha_token.clone(),
        vaptcha_serve: None, // 新的验证方式不需要server参数
    };

    // 调用登录API
    let response = client
        .post("https://api.mefrp.yealqp.cn/api/public/login")
        .header("Content-Type", "application/json")
        .json(&login_request)
        .send()
        .await
        .map_err(|e| format!("登录请求失败: {e}"))?;

    // 尝试解析响应体，即使HTTP状态码不是2xx
    // ME-Frp API在业务错误时也会返回非2xx状态码，但响应体中包含详细错误信息
    let api_response: ApiResponse<LoginData> = response
        .json()
        .await
        .map_err(|e| format!("解析登录响应失败: {e}"))?;

    if api_response.code != 200 {
        return Err(api_response.message);
    }

    let login_data = api_response.data.ok_or("登录响应数据为空")?;
    let user_token = login_data.token.clone();

    // 获取frp_token
    let frp_response = client
        .get("https://api.mefrp.yealqp.cn/api/auth/user/frpToken")
        .header("authorization", format!("Bearer {user_token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取frp_token失败: {e}"))?;

    let mut frp_token = String::new();
    if frp_response.status().is_success() {
        let frp_api_response: ApiResponse<FrpTokenData> = frp_response
            .json()
            .await
            .map_err(|e| format!("解析frp_token响应失败: {e}"))?;

        if frp_api_response.code == 200 {
            if let Some(frp_data) = frp_api_response.data {
                frp_token = frp_data.token;
            }
        }
    }

    Ok((user_token, frp_token, login_data))
}

/// 获取用户信息
///
/// # 参数
/// - token: 用户token
///
/// # 返回
/// 成功返回用户详细信息
pub async fn get_user_info(token: &str) -> Result<UserDetailInfo, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.yealqp.cn/api/auth/user/info")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取用户信息请求失败: {e}"))?;

    // 尝试解析响应体，即使HTTP状态码不是2xx
    let api_response: ApiResponse<UserDetailInfo> = response
        .json()
        .await
        .map_err(|e| format!("解析用户信息响应失败: {e}"))?;

    if api_response.code != 200 {
        return Err(api_response.message);
    }

    api_response.data.ok_or("用户信息响应数据为空".to_string())
}

/// 用户签到
///
/// # 参数
/// - token: 用户token
/// - captcha_token: 验证码token
///
/// # 返回
/// 成功返回签到响应文本
pub async fn user_sign(token: &str, captcha_token: String) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .post("https://api.mefrp.yealqp.cn/api/auth/user/sign")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "captchaToken": captcha_token
        }))
        .send()
        .await
        .map_err(|e| format!("签到请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("签到失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析签到响应失败: {e}"))?;

    Ok(response_text)
}

/// 兑换CDK
///
/// # 参数
/// - token: 用户token
/// - code: CDK代码
/// - captcha_token: 验证码token
///
/// # 返回
/// 成功返回兑换响应文本
pub async fn redeem_cdk(
    token: &str,
    code: String,
    captcha_token: String,
) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .post("https://api.mefrp.yealqp.cn/api/auth/cdk/redeem")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "code": code,
            "captchaToken": captcha_token
        }))
        .send()
        .await
        .map_err(|e| format!("CDK兑换请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("CDK兑换失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析CDK兑换响应失败: {e}"))?;

    Ok(response_text)
}

/// 获取FRP Token
///
/// # 参数
/// - token: 用户token
///
/// # 返回
/// 成功返回frp_token
pub async fn get_frp_token(token: &str) -> Result<String, String> {
    let client = create_http_client();

    // 获取frp_token
    let response = client
        .get("https://api.mefrp.yealqp.cn/api/auth/user/frpToken")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取frp_token失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("获取frp_token失败，状态码: {}", response.status()));
    }

    let api_response: ApiResponse<FrpTokenData> = response
        .json()
        .await
        .map_err(|e| format!("解析frp_token响应失败: {e}"))?;

    if api_response.code != 200 {
        return Err(format!("获取frp_token失败: {}", api_response.message));
    }

    let frp_data = api_response.data.ok_or("frp_token响应数据为空")?;
    Ok(frp_data.token)
}

/// 获取CDK兑换历史
///
/// # 参数
/// - token: 用户token
///
/// # 返回
/// 成功返回CDK兑换历史响应文本
pub async fn get_cdk_history(token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .get("https://api.mefrp.yealqp.cn/api/auth/cdk/usage")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("获取CDK兑换历史请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "获取CDK兑换历史失败，状态码: {}",
            response.status()
        ));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析CDK兑换历史响应失败: {e}"))?;

    Ok(response_text)
}

/// 发送邮箱验证码
///
/// # 参数
/// - email: 邮箱地址
/// - captcha_token: 验证码token
///
/// # 返回
/// 成功返回响应文本
pub async fn send_email_code(email: String, captcha_token: String) -> Result<String, String> {
    let client = create_http_client();

    let request_data = EmailCodeRequest {
        email,
        captcha_token,
    };

    let response = client
        .post("https://api.mefrp.yealqp.cn/api/public/register/emailCode")
        .header("Content-Type", "application/json")
        .json(&request_data)
        .send()
        .await
        .map_err(|e| format!("发送邮箱验证码请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "发送邮箱验证码失败，状态码: {}",
            response.status()
        ));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析邮箱验证码响应失败: {e}"))?;

    Ok(response_text)
}

/// 用户注册
///
/// # 参数
/// - username: 用户名
/// - email: 邮箱地址
/// - password: 密码
/// - email_code: 邮箱验证码
///
/// # 返回
/// 成功返回响应文本
pub async fn register(
    username: String,
    email: String,
    password: String,
    email_code: String,
) -> Result<String, String> {
    let client = create_http_client();

    let request_data = RegisterRequest {
        username,
        email,
        password,
        email_code,
    };

    let response = client
        .post("https://api.mefrp.yealqp.cn/api/public/register")
        .header("Content-Type", "application/json")
        .json(&request_data)
        .send()
        .await
        .map_err(|e| format!("注册请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("注册失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析注册响应失败: {e}"))?;

    Ok(response_text)
}

/// 重置访问密钥
///
/// # 参数
/// - token: 用户token
/// - captcha_token: 验证码token
///
/// # 返回
/// 成功返回响应文本
pub async fn reset_token(token: &str, captcha_token: &str) -> Result<String, String> {
    let client = create_http_client();

    let response = client
        .post("https://api.mefrp.com/api/auth/user/tokenReset")
        .header("authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "captchaToken": captcha_token
        }))
        .send()
        .await
        .map_err(|e| format!("重置访问密钥请求失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("重置访问密钥失败，状态码: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("解析重置访问密钥响应失败: {e}"))?;

    Ok(response_text)
}
