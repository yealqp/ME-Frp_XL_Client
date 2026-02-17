//! 配置管理器
//!
//! 本模块负责配置文件的读取、保存、迁移和清除功能。
//! 支持新的统一配置格式（config.yaml），并提供从旧格式（config.json, settings.json）迁移的功能。

use crate::models::config::{AppSettings, Config, UnifiedConfig};
use std::env;
use std::fs;
use std::path::PathBuf;

/// 获取配置文件所在目录
///
/// 优先使用可执行文件所在目录，确保开机自启动时也能正确找到配置文件
fn get_config_dir() -> Result<PathBuf, String> {
    // 尝试获取可执行文件所在目录
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return Ok(exe_dir.to_path_buf());
        }
    }
    
    // 如果获取失败，回退到当前工作目录
    env::current_dir().map_err(|e| format!("获取配置目录失败: {e}"))
}

/// 保存统一配置到 config.yaml（使用新格式）
///
/// 新格式移除了以下冗余字段：
/// - api_status: 运行时状态，不需要持久化
/// - theme: 前端主题设置
/// - login_time: 登录时间
/// - user_info.token, user_info.username: 冗余字段
///
/// 并将 user_info.group 提升到顶层作为 group 字段
pub async fn save_unified_config(config: &UnifiedConfig) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join("config.yaml");

    let yaml_content = serde_yaml::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, yaml_content).map_err(|e| e.to_string())?;

    Ok(())
}

/// 加载统一配置（支持新格式）
///
/// 如果 config.yaml 存在，直接加载
/// 如果不存在，尝试从旧配置文件迁移
pub async fn load_unified_config() -> Result<UnifiedConfig, String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join("config.yaml");

    if config_path.exists() {
        // 如果统一配置文件存在，直接加载
        let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
        let config: UnifiedConfig = serde_yaml::from_str(&content).map_err(|e| e.to_string())?;
        return Ok(config);
    }

    // 如果统一配置文件不存在，尝试迁移旧配置
    migrate_old_configs().await
}

/// 从旧格式迁移配置（提取 user_info.group 到顶层）
///
/// 迁移逻辑：
/// 1. 尝试加载旧的 config.json（包含登录信息）
/// 2. 尝试加载旧的 settings.json（包含应用设置）
/// 3. 提取 user_info.group 到顶层 group 字段
/// 4. 忽略已删除的字段（api_status, theme, login_time, user_info.token, user_info.username）
/// 5. 保存为新格式的 config.yaml
/// 6. 删除旧配置文件
pub async fn migrate_old_configs() -> Result<UnifiedConfig, String> {
    let mut unified_config = UnifiedConfig::default();

    // 尝试加载旧的 config.json
    if let Ok(Some(old_config)) = read_config().await {
        // 迁移登录相关信息
        unified_config.user_token = old_config.user_token;
        unified_config.frp_token = old_config.frp_token;
        unified_config.username = old_config.username;

        // 提取 user_info.group 到顶层 group 字段（需求 3.4, 3.6, 11.5）
        if let Some(group) = old_config.user_info.group {
            unified_config.group = group;
        }

        // 忽略已删除的字段：api_status, login_time, user_info.token, user_info.username（需求 3.3, 11.6）
    }

    // 尝试加载旧的 settings.json
    if let Ok(old_settings) = load_settings().await {
        unified_config.auto_start = old_settings.auto_start;
        unified_config.always_on_top = old_settings.always_on_top;
        unified_config.auto_update = old_settings.auto_update;
        unified_config.auto_start_tunnels = old_settings.auto_start_tunnels;
        unified_config.startup_delay = old_settings.startup_delay;
        unified_config.minimize_to_tray = old_settings.minimize_to_tray;

        // 忽略已删除的字段：theme（需求 3.3, 11.6）
    }

    // 保存统一配置
    save_unified_config(&unified_config).await?;

    // 删除旧配置文件
    let config_dir = get_config_dir()?;
    let old_config_path = config_dir.join("config.json");
    let old_settings_path = config_dir.join("settings.json");

    if old_config_path.exists() {
        let _ = fs::remove_file(old_config_path);
    }

    if old_settings_path.exists() {
        let _ = fs::remove_file(old_settings_path);
    }

    Ok(unified_config)
}

/// 清除配置文件
///
/// 删除 config.yaml、config.json 和 settings.json
pub async fn clear_config() -> Result<(), String> {
    let config_dir = get_config_dir()?;

    // 删除新配置文件
    let config_yaml_path = config_dir.join("config.yaml");
    if config_yaml_path.exists() {
        fs::remove_file(&config_yaml_path).map_err(|e| format!("删除 config.yaml 失败: {e}"))?;
    }

    // 删除旧配置文件
    let config_json_path = config_dir.join("config.json");
    if config_json_path.exists() {
        fs::remove_file(&config_json_path).map_err(|e| format!("删除 config.json 失败: {e}"))?;
    }

    let settings_path = config_dir.join("settings.json");
    if settings_path.exists() {
        fs::remove_file(&settings_path).map_err(|e| format!("删除 settings.json 失败: {e}"))?;
    }

    Ok(())
}

// ============================================================================
// 向后兼容的函数（保留用于迁移）
// ============================================================================

/// 保存旧格式配置（向后兼容）
///
/// 保留此函数用于向后兼容，但建议使用 save_unified_config
pub async fn save_config(config: &Config) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join("config.json");

    // 将配置转换为YAML格式
    let yaml_content = format!(
        "api_status: {}\nlogin_time: {}\nuser_token: {}\nfrp_token: {}\nusername: {}\nuser_info:\n  group: {}\n  token: {}\n  username: {}",
        config.api_status,
        config.login_time,
        config.user_token,
        config.frp_token,
        config.username,
        config.user_info.group.as_ref().unwrap_or(&String::new()),
        config.user_info.token.as_ref().unwrap_or(&String::new()),
        config.user_info.username.as_ref().unwrap_or(&String::new())
    );

    fs::write(&config_path, yaml_content)
        .map_err(|e| format!("Failed to write config file: {e}"))?;

    Ok(())
}

/// 读取旧格式配置（向后兼容）
///
/// 保留此函数用于迁移旧配置，但建议使用 load_unified_config
pub async fn read_config() -> Result<Option<Config>, String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join("config.json");

    if !config_path.exists() {
        return Ok(None);
    }

    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config file: {e}"))?;

    // 简单的YAML解析
    let lines: Vec<&str> = content.lines().collect();
    let mut config = Config {
        api_status: String::new(),
        login_time: String::new(),
        user_token: String::new(),
        frp_token: String::new(),
        username: String::new(),
        user_info: crate::models::auth::UserInfo {
            group: None,
            token: None,
            username: None,
        },
    };

    for line in lines {
        let line = line.trim();
        if line.starts_with("api_status:") {
            config.api_status = line.split(':').nth(1).unwrap_or("").trim().to_string();
        } else if line.starts_with("login_time:") {
            config.login_time = line.split(':').nth(1).unwrap_or("").trim().to_string();
        } else if line.starts_with("user_token:") {
            config.user_token = line.split(':').nth(1).unwrap_or("").trim().to_string();
        } else if line.starts_with("frp_token:") {
            config.frp_token = line.split(':').nth(1).unwrap_or("").trim().to_string();
        } else if line.starts_with("username:") && !line.contains("user_info:") {
            config.username = line.split(':').nth(1).unwrap_or("").trim().to_string();
        } else if line.starts_with("group:") {
            config.user_info.group = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        } else if line.starts_with("token:") {
            config.user_info.token = Some(line.split(':').nth(1).unwrap_or("").trim().to_string());
        }
    }

    Ok(Some(config))
}

/// 加载应用设置（内部使用，用于迁移）
///
/// 此函数仅在迁移过程中使用，不应在新代码中调用
pub(crate) async fn load_settings() -> Result<AppSettings, String> {
    let config_dir = get_config_dir()?;
    let settings_path = config_dir.join("settings.json");

    if !settings_path.exists() {
        return Ok(AppSettings::default());
    }

    let settings_content =
        fs::read_to_string(&settings_path).map_err(|e| format!("读取设置文件失败: {e}"))?;

    let settings: AppSettings =
        serde_json::from_str(&settings_content).unwrap_or_else(|_| AppSettings::default());

    Ok(settings)
}
