//! AI 分析模块 (OpenAI 兼容 API)
//!
//! 提供日志分析功能，调用远程 LLM API

use serde::{Deserialize, Serialize};

const API_URL: &str = "https://apihub.agnes-ai.com/v1/chat/completions";
const API_KEY: &str = "REDACTED_AI_API_KEY";
const DEFAULT_MODEL: &str = "agnes-2.0-flash";

/// 系统提示词 (编译时嵌入)
static SYSTEM_PROMPT: &str = include_str!("../../../public/system.md");

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ResponseMessage {
    content: String,
}

/// 调用 AI 分析日志
///
/// * `log_content` - 日志原始内容
/// * `custom_prompt` - 用户自定义额外提示 (可选)
/// * `tunnel_name` - 隧道名称 (可选)
/// * `tunnel_type` - 隧道类型 (可选)
pub async fn analyze_log(
    log_content: &str,
    custom_prompt: Option<&str>,
    tunnel_name: Option<&str>,
    tunnel_type: Option<&str>,
) -> Result<String, String> {
    // 构建隧道信息前缀
    let tunnel_info = match (tunnel_name, tunnel_type) {
        (Some(name), Some(tp)) => format!("隧道名称：{}\n隧道类型：{}\n\n", name, tp.to_uppercase()),
        (Some(name), None) => format!("隧道名称：{}\n\n", name),
        (None, Some(tp)) => format!("隧道类型：{}\n\n", tp.to_uppercase()),
        _ => String::new(),
    };

    // 构建用户消息
    let user_content = match custom_prompt {
        Some(prompt) if !prompt.trim().is_empty() => {
            format!("{}{}\n\n以下是隧道日志内容，请根据以上要求进行分析：\n\n{}", tunnel_info, prompt, log_content)
        }
        _ => {
            format!("{}请分析以下隧道日志，指出可能的问题或优化建议：\n\n{}", tunnel_info, log_content)
        }
    };

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: SYSTEM_PROMPT.to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: user_content,
        },
    ];

    let request_body = ChatCompletionRequest {
        model: DEFAULT_MODEL.to_string(),
        messages,
        stream: false,
    };

    let client = reqwest::Client::new();
    let response = client
        .post(API_URL)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", API_KEY))
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("请求 AI 服务失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "无法读取错误正文".to_string());
        return Err(format!("AI 服务返回错误 ({}): {}", status, error_text));
    }

    let resp_data: ChatCompletionResponse = response
        .json()
        .await
        .map_err(|e| format!("解析 AI 响应失败: {}", e))?;

    resp_data
        .choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .ok_or_else(|| "AI 响应中没有有效的内容".to_string())
}
