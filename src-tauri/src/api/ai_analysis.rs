//! AI 分析模块
//!
//! 将隧道日志发送到 XL 服务端 `ai_analysis.php`，由服务端注入系统提示词并
//! 以 OpenAI completions 格式转发到 AI 服务。
//!
//! 安全设计：
//! - 客户端不持有任何 AI 服务密钥（服务端配置 AI_API_KEY）
//! - 系统提示词迁移到服务端维护（`server/ai_analysis.php` 中 SYSTEM_PROMPT）
//! - 使用带超时的统一 HTTP 客户端，避免网络挂起导致请求永久 pending
//! - 日志/提示词在客户端侧截断，与服务端限长保持一致

use crate::api::client::create_http_client;
use serde::{Deserialize, Serialize};

const AI_ANALYSIS_API_URL: &str = "https://xlc.mefrp.yealqp.cn/ai_analysis.php";
const AI_ANALYSIS_API_TOKEN: &str = "yealqpxlclientaianalysissecret";

/// 与 server/ai_analysis.php 的 MAX_LOG_LENGTH / MAX_PROMPT_LENGTH 保持一致
const MAX_LOG_CHARS: usize = 20_000;
const MAX_PROMPT_CHARS: usize = 2_000;

/// 发送到分析服务端的请求体
#[derive(Serialize, Debug)]
struct AnalysisRequest {
    log_content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    custom_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tunnel_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tunnel_type: Option<String>,
}

/// 分析服务端成功响应（{ ok: true, data: { content } }）
#[derive(Deserialize, Debug)]
struct AnalysisSuccessResponse {
    ok: bool,
    data: Option<AnalysisData>,
}

#[derive(Deserialize, Debug)]
struct AnalysisData {
    content: String,
}

/// 分析服务端错误响应（{ error: "..." }）
#[derive(Deserialize, Debug)]
struct AnalysisErrorResponse {
    error: String,
}

/// 截断字符串到指定字符数，超出时附加截断提示
fn truncate_chars(input: &str, max_chars: usize) -> String {
    if input.chars().count() <= max_chars {
        return input.to_string();
    }

    let mut truncated: String = input.chars().take(max_chars).collect();
    truncated.push_str("\n...（内容过长，已截断）");
    truncated
}

/// 截断响应文本用于错误提示
fn truncate_response(text: &str) -> String {
    if text.chars().count() <= 300 {
        text.to_string()
    } else {
        let mut truncated: String = text.chars().take(300).collect();
        truncated.push_str("…");
        truncated
    }
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
    let request_body = AnalysisRequest {
        log_content: truncate_chars(log_content, MAX_LOG_CHARS),
        custom_prompt: custom_prompt
            .map(|p| truncate_chars(p, MAX_PROMPT_CHARS))
            .filter(|p| !p.trim().is_empty()),
        tunnel_name: tunnel_name.map(str::to_string),
        tunnel_type: tunnel_type.map(str::to_string),
    };

    let client = create_http_client();
    let response = client
        .post(AI_ANALYSIS_API_URL)
        .header("Authorization", format!("Bearer {AI_ANALYSIS_API_TOKEN}"))
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("请求 AI 分析服务失败: {e}"))?;

    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("读取 AI 分析响应失败: {e}"))?;

    if status.is_success() {
        let parsed: AnalysisSuccessResponse = serde_json::from_str(&response_text).map_err(|e| {
            format!(
                "解析 AI 分析响应失败: {}，原始响应: {}",
                e,
                truncate_response(&response_text)
            )
        })?;

        if parsed.ok {
            if let Some(content) = parsed.data.map(|d| d.content).filter(|c| !c.trim().is_empty()) {
                return Ok(content);
            }
            return Err("AI 分析服务返回了空内容".to_string());
        }

        return Err("AI 分析服务返回失败".to_string());
    }

    // 尝试提取结构化错误信息，回退到原始响应
    let error_msg = serde_json::from_str::<AnalysisErrorResponse>(&response_text)
        .map(|e| e.error)
        .unwrap_or_else(|_| format!("HTTP {}: {}", status, truncate_response(&response_text)));
    Err(format!("AI 分析服务错误: {error_msg}"))
}
