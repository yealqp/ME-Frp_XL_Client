//! 用户统计上报 API
//!
//! 本模块将 Dashboard 访问用户信息上报到 XL Client 服务端。

use crate::api::client::{create_http_client, send_request, with_bearer_auth};
use serde::{Deserialize, Serialize};

const ANALYSIS_API_URL: &str = "https://xlc.mefrp.yealqp.cn/analysis.php";

// 客户端预共享密钥（防滥用认证）：
// - 生产构建通过环境变量 XL_ANALYSIS_TOKEN 注入覆盖，源码仓库不保留敏感明文
// - 未注入时回退内置默认值，保持开箱即用；服务端应配合 IP 限流兜底
// 构建示例：$env:XL_ANALYSIS_TOKEN="<强随机值>"; cargo build --release
const ANALYSIS_API_TOKEN: &str = match option_env!("XL_ANALYSIS_TOKEN") {
    Some(token) => token,
    None => "yealqpxlclientanalysissecret",
};

#[derive(Serialize, Deserialize, Debug)]
struct AnalysisReportRequest {
    #[serde(rename = "MEFrpID")]
    me_frp_id: i32,
    username: String,
    email: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct AnalysisSuccessResponse {
    ok: bool,
    duplicate: bool,
    message: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct AnalysisErrorResponse {
    error: String,
}

pub async fn report_user_analysis(
    me_frp_id: i32,
    username: &str,
    email: &str,
) -> Result<String, String> {
    let request_body = AnalysisReportRequest {
        me_frp_id,
        username: username.to_string(),
        email: email.to_string(),
    };

    let client = create_http_client();
    let response = send_request(
        with_bearer_auth(client.post(ANALYSIS_API_URL), ANALYSIS_API_TOKEN).json(&request_body),
        "上报用户统计请求失败",
    )
    .await?;

    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    if status.is_success() {
        let parsed: AnalysisSuccessResponse = serde_json::from_str(&response_text)
            .map_err(|e| format!("解析成功响应失败: {}，原始响应: {}", e, response_text))?;
        if parsed.ok {
            Ok(parsed.message)
        } else {
            Err(format!("服务器返回失败: duplicate={}", parsed.duplicate))
        }
    } else {
        let error_msg = serde_json::from_str::<AnalysisErrorResponse>(&response_text)
            .map(|e| e.error)
            .unwrap_or_else(|_| format!("HTTP {}: {}", status, response_text));
        Err(format!("服务器错误: {}", error_msg))
    }
}
