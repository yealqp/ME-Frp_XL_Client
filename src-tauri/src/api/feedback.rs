//! 反馈相关API
//!
//! 本模块提供用户反馈功能，包括发送反馈到QQ群

use crate::api::client::{create_http_client, send_request, with_json_headers};
use serde::{Deserialize, Serialize};

const NAPCAT_API_URL: &str = "https://napcat.yealqp.cn/send_group_msg";
const NAPCAT_GROUP_ID: u64 = 1039784218;
const NAPCAT_AUTHORIZATION: &str = "Bearer REDACTED_QQ_BOT_API_KEY";

/// NapCat 消息文本结构
#[derive(Serialize, Deserialize, Debug)]
struct MessageText {
    #[serde(rename = "type")]
    msg_type: String,
    data: MessageData,
}

#[derive(Serialize, Deserialize, Debug)]
struct MessageData {
    text: String,
}

/// NapCat 发送群消息请求
#[derive(Serialize, Deserialize, Debug)]
struct SendGroupMessageRequest {
    group_id: u64,
    message: Vec<MessageText>,
}

/// NapCat API 响应
#[derive(Serialize, Deserialize, Debug)]
struct NapCatResponse {
    status: String,
    retcode: i32,
}

/// 发送反馈到QQ群
pub async fn send_feedback(
    _user_token: &str,
    content: &str,
    user_id: i32,
) -> Result<String, String> {
    // 构建反馈消息
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let feedback_message = format!(
        "【XL Client用户反馈】\n时间：{}\nME-Frp ID：{}\n内容：{}",
        timestamp, user_id, content
    );

    // 构建请求体
    let request_body = SendGroupMessageRequest {
        group_id: NAPCAT_GROUP_ID,
        message: vec![MessageText {
            msg_type: "text".to_string(),
            data: MessageData {
                text: feedback_message,
            },
        }],
    };

    // 发送到 NapCat API
    let client = create_http_client();
    let response = send_request(
        with_json_headers(client.post(NAPCAT_API_URL))
            .header("Authorization", NAPCAT_AUTHORIZATION)
            .json(&request_body),
        "发送请求失败",
    )
    .await?;

    if !response.status().is_success() {
        return Err(format!("HTTP错误: {}", response.status()));
    }

    let result: NapCatResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    if result.status == "ok" && result.retcode == 0 {
        Ok("反馈提交成功".to_string())
    } else {
        Err("提交失败".to_string())
    }
}
