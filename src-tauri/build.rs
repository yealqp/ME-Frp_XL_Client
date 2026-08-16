//! 构建脚本
//!
//! 除 Tauri 标准构建外，还负责从 `server/secrets.env` 读取客户端预共享密钥，
//! 并通过 `cargo:rustc-env` 注入编译环境，供 `env!("XL_*_TOKEN")` 编译期读取。
//!
//! 设计说明：
//! - 密钥只存放于 server/ 目录（已被 .gitignore 忽略，不进入公开仓库）
//! - 源码中不保留任何密钥明文，未配置时注入空字符串（构建可用，
//!   但调用服务端时因空 token 会被服务端 401 拒绝，提示需配置密钥）

use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    inject_client_secrets();
    tauri_build::build()
}

/// 从 server/secrets.env 读取密钥并注入编译环境
fn inject_client_secrets() {
    let manifest_dir =
        env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string());
    let secrets_path = Path::new(&manifest_dir).join("../server/secrets.env");

    let mut secrets: HashMap<String, String> = HashMap::new();

    if let Ok(content) = fs::read_to_string(&secrets_path) {
        for line in content.lines() {
            let line = line.trim();
            // 跳过空行与注释
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            // 解析 key=value（值去除首尾空白）
            if let Some((key, value)) = line.split_once('=') {
                secrets.insert(key.trim().to_string(), value.trim().to_string());
            }
        }
    }

    // 需要注入的密钥变量：文件缺失或未定义时注入空字符串（默认留空）
    for var in [
        "XL_FEEDBACK_TOKEN",
        "XL_ANALYSIS_TOKEN",
        "XL_AI_ANALYSIS_TOKEN",
    ] {
        let value = secrets.get(var).cloned().unwrap_or_default();
        println!("cargo:rustc-env={var}={value}");
    }
}
