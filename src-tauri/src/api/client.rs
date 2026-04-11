//! HTTP客户端模块
//!
//! 提供HTTP客户端创建和版本信息

use reqwest::{RequestBuilder, Response};

// 从 utils 模块导入 HTTP 客户端创建函数和版本常量
pub use crate::utils::http::{create_http_client, CURRENT_VERSION};

pub fn with_json_headers(builder: RequestBuilder) -> RequestBuilder {
    builder.header("Content-Type", "application/json")
}

pub fn with_bearer_auth(builder: RequestBuilder, token: &str) -> RequestBuilder {
    with_json_headers(builder).header("authorization", format!("Bearer {token}"))
}

pub async fn send_request(
    builder: RequestBuilder,
    request_error: &str,
) -> Result<Response, String> {
    builder
        .send()
        .await
        .map_err(|e| format!("{request_error}: {e}"))
}

pub async fn read_text_response(
    response: Response,
    response_error: &str,
    parse_error: &str,
) -> Result<String, String> {
    if !response.status().is_success() {
        return Err(format!("{response_error}，状态码: {}", response.status()));
    }

    response
        .text()
        .await
        .map_err(|e| format!("{parse_error}: {e}"))
}

pub async fn send_text_request(
    builder: RequestBuilder,
    request_error: &str,
    response_error: &str,
    parse_error: &str,
) -> Result<String, String> {
    let response = send_request(builder, request_error).await?;
    read_text_response(response, response_error, parse_error).await
}

#[cfg(test)]
mod tests {
    use super::{read_text_response, send_request, send_text_request, with_bearer_auth, with_json_headers};
    use std::io::{Read, Write};
    use std::net::TcpListener;
    use std::thread;

    fn spawn_test_server(response: &'static str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("listener should bind");
        let address = listener.local_addr().expect("listener should have local addr");

        thread::spawn(move || {
            let (mut stream, _) = listener.accept().expect("server should accept connection");
            let mut buffer = [0_u8; 1024];
            let _ = stream.read(&mut buffer);
            let _ = stream.write_all(response.as_bytes());
            let _ = stream.flush();
        });

        format!("http://{address}")
    }

    #[test]
    fn with_json_headers_adds_content_type() {
        let client = reqwest::Client::new();
        let request = with_json_headers(client.get("https://example.com"))
            .build()
            .expect("request should build");

        assert_eq!(
            request.headers().get("Content-Type").and_then(|value| value.to_str().ok()),
            Some("application/json")
        );
    }

    #[test]
    fn with_bearer_auth_adds_auth_and_content_type() {
        let client = reqwest::Client::new();
        let request = with_bearer_auth(client.post("https://example.com"), "token-123")
            .build()
            .expect("request should build");

        assert_eq!(
            request.headers().get("authorization").and_then(|value| value.to_str().ok()),
            Some("Bearer token-123")
        );
        assert_eq!(
            request.headers().get("Content-Type").and_then(|value| value.to_str().ok()),
            Some("application/json")
        );
    }

    #[tokio::test]
    async fn send_request_returns_response_on_success() {
        let url = spawn_test_server(
            "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok",
        );
        let client = reqwest::Client::new();

        let response = send_request(client.get(url), "请求失败")
            .await
            .expect("request should succeed");

        assert_eq!(response.status(), reqwest::StatusCode::OK);
    }

    #[tokio::test]
    async fn read_text_response_returns_body_on_success() {
        let url = spawn_test_server(
            "HTTP/1.1 200 OK\r\nContent-Length: 5\r\nConnection: close\r\n\r\nhello",
        );
        let client = reqwest::Client::new();
        let response = client
            .get(url)
            .send()
            .await
            .expect("request should succeed");

        let body = read_text_response(response, "响应失败", "解析失败")
            .await
            .expect("body should parse");

        assert_eq!(body, "hello");
    }

    #[tokio::test]
    async fn send_text_request_reports_non_success_status() {
        let url = spawn_test_server(
            "HTTP/1.1 500 Internal Server Error\r\nContent-Length: 4\r\nConnection: close\r\n\r\noops",
        );
        let client = reqwest::Client::new();

        let error = send_text_request(client.get(url), "请求失败", "响应失败", "解析失败")
            .await
            .expect_err("non-success response should error");

        assert!(error.contains("响应失败"));
        assert!(error.contains("500"));
    }
}
