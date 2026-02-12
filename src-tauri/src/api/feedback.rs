//! 反馈相关API
//!
//! 本模块提供用户反馈功能，包括发送反馈到QQ群

use crate::utils::http::create_http_client;
use serde::{Deserialize, Serialize};

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
        "【XL客户端用户反馈】\n时间：{}\nME-Frp ID：{}\n内容：{}",
        timestamp, user_id, content
    );

    // 构建请求体
    let request_body = SendGroupMessageRequest {
        group_id: 1039784218,
        message: vec![MessageText {
            msg_type: "text".to_string(),
            data: MessageData {
                text: feedback_message,
            },
        }],
    };

    // 发送到 NapCat API
    let client = create_http_client();
    let response = client
        .post("https://napcat.yealqp.cn/send_group_msg")
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer REDACTED_QQ_BOT_API_KEY")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("发送请求失败: {}", e))?;

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
