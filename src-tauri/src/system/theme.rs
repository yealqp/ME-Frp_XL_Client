//! 系统主题检测模块
//!
//! 提供获取操作系统真实主题的能力。
//!
//! ## 为什么不用 Tauri 的 window.theme()
//!
//! 应用在切换主题时会调用 `window.setTheme()`，这会固定窗口主题（WebView2
//! SetTheme），导致 `window.theme()`、`prefers-color-scheme`（matchMedia）
//! 以及 `onThemeChanged` 事件全部反映"窗口主题"而非"系统主题"，被应用自身
//! 的设置污染。因此系统主题只能通过操作系统层面读取：
//!
//! - Windows: 注册表 `HKCU\...\Themes\Personalize\AppsUseLightTheme`
//!   （0 = 暗色，1 = 浅色）

/// 获取操作系统真实主题
///
/// # 返回
/// - `Ok("light")` - 系统为浅色主题
/// - `Ok("dark")` - 系统为暗色主题
/// - `Err(String)` - 检测失败（如注册表不可读）
#[cfg(windows)]
pub fn get_system_theme() -> Result<String, String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    const PERSONALIZE_PATH: &str =
        r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize";

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .open_subkey(PERSONALIZE_PATH)
        .map_err(|e| format!("读取系统主题失败（无法打开注册表项）: {e}"))?;

    // AppsUseLightTheme：应用界面主题（1 = 浅色，0 = 暗色）
    // 优先使用；若缺失则回退到 SystemUsesLightTheme（系统任务栏主题）
    let apps_light: u32 = key
        .get_value("AppsUseLightTheme")
        .or_else(|_| key.get_value("SystemUsesLightTheme"))
        .map_err(|e| format!("读取系统主题失败（注册表值不可读）: {e}"))?;

    Ok(if apps_light == 1 { "light" } else { "dark" }.to_string())
}

/// 非 Windows 平台暂不支持系统主题检测
#[cfg(not(windows))]
pub fn get_system_theme() -> Result<String, String> {
    Err("当前平台不支持系统主题检测".to_string())
}

#[cfg(test)]
mod tests {
    // Windows 注册表读取无法在单元测试中模拟真实环境，
    // 仅验证返回值为合法主题值域
    #[cfg(windows)]
    #[test]
    fn system_theme_result_is_valid_or_error() {
        match super::get_system_theme() {
            Ok(theme) => {
                assert!(theme == "light" || theme == "dark", "非法主题值: {theme}");
            }
            Err(_) => {
                // 无注册表环境（如 CI）时允许失败
            }
        }
    }
}
