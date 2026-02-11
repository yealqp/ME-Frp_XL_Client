//! 自动启动管理模块
//!
//! 本模块负责管理应用的开机自启动功能。
//!
//! ## 功能
//! - 设置开机自启动（Windows注册表）

use std::process::Command;

/// 设置开机自启动
///
/// # 参数
/// - `enable`: true 启用自启动，false 禁用自启动
///
/// # 返回
/// - `Ok(String)`: 操作成功的消息
/// - `Err(String)`: 操作失败的错误信息
///
/// # 平台支持
/// - Windows: 通过注册表实现
/// - 其他平台: 暂不支持
pub async fn set_auto_start(enable: bool) -> Result<String, String> {
    // 这里需要根据操作系统实现开机自启动
    // Windows: 注册表或启动文件夹
    // macOS: LaunchAgents
    // Linux: systemd 或 autostart

    #[cfg(target_os = "windows")]
    {
        if enable {
            // 添加到注册表启动项
            let output = Command::new("reg")
                .args([
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "ME-Frp",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &format!("\"{}\"", std::env::current_exe().unwrap().display()),
                    "/f",
                ])
                .output()
                .map_err(|e| format!("执行注册表命令失败: {e}"))?;

            if !output.status.success() {
                return Err("设置开机自启动失败".to_string());
            }
        } else {
            // 从注册表删除启动项
            let _output = Command::new("reg")
                .args([
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "ME-Frp",
                    "/f",
                ])
                .output()
                .map_err(|e| format!("执行注册表命令失败: {e}"))?;
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // 其他操作系统的实现
        return Err("当前操作系统暂不支持开机自启动设置".to_string());
    }

    Ok(if enable {
        "开机自启动已开启"
    } else {
        "开机自启动已关闭"
    }
    .to_string())
}
