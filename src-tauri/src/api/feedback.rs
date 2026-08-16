//! 反馈相关API
//!
//! 本模块提供用户反馈功能，将反馈数据发送到远程反馈服务器

use crate::api::client::{create_http_client, send_request, with_bearer_auth};
use serde::{Deserialize, Serialize};

const FEEDBACK_API_URL: &str = "https://xlc.mefrp.yealqp.cn/feedbacks.php";

// 客户端预共享密钥（防滥用认证）：
// - 生产构建通过环境变量 XL_FEEDBACK_TOKEN 注入覆盖，源码仓库不保留敏感明文
// - 未注入时回退内置默认值，保持开箱即用；服务端应配合 IP 限流兜底
// 构建示例：$env:XL_FEEDBACK_TOKEN="<强随机值>"; cargo build --release
const FEEDBACK_API_TOKEN: &str = match option_env!("XL_FEEDBACK_TOKEN") {
    Some(token) => token,
    None => "yealqpxlclientfeedbacksecret",
};

/// 发送到反馈服务器的请求体
#[derive(Serialize, Deserialize, Debug)]
struct FeedbackRequest {
    token: &'static str,
    user_id: i32,
    content: String,
}

/// 反馈服务器的成功响应
#[derive(Serialize, Deserialize, Debug)]
struct FeedbackSuccessResponse {
    ok: bool,
    file: String,
    message: String,
}

/// 反馈服务器的错误响应
#[derive(Serialize, Deserialize, Debug)]
struct FeedbackErrorResponse {
    error: String,
}

/// 发送反馈到远程反馈服务器
///
/// * `content` - 反馈内容
/// * `user_id` - 用户 ID
pub async fn send_feedback(
    content: &str,
    user_id: i32,
) -> Result<String, String> {
    let request_body = FeedbackRequest {
        token: FEEDBACK_API_TOKEN,
        user_id,
        content: content.to_string(),
    };

    let client = create_http_client();
    let response = send_request(
        with_bearer_auth(client.post(FEEDBACK_API_URL), FEEDBACK_API_TOKEN)
            .json(&request_body),
        "发送反馈请求失败",
    )
    .await?;

    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    if status.is_success() {
        let parsed: FeedbackSuccessResponse = serde_json::from_str(&response_text)
            .map_err(|e| format!("解析成功响应失败: {}，原始响应: {}", e, response_text))?;
        if parsed.ok {
            Ok(format!("反馈提交成功: {}", parsed.message))
        } else {
            Err(format!("服务器返回失败: ok=false, file={}", parsed.file))
        }
    } else {
        // 尝试从响应体提取结构化错误信息，回退到原始文本
        let error_msg = serde_json::from_str::<FeedbackErrorResponse>(&response_text)
            .map(|e| e.error)
            .unwrap_or_else(|_| format!("HTTP {}: {}", status, response_text));
        Err(format!("服务器错误: {}", error_msg))
    }
}