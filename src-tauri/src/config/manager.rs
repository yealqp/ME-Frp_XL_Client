//! 配置管理器
//!
//! 本模块负责配置文件的读取、保存、迁移和清除功能。
//! 支持新的统一配置格式（config.yaml），并提供从旧格式（config.json, settings.json）迁移的功能。

use crate::models::config::UnifiedConfig;
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
    let config_dir = get_config_dir()?;

    // 尝试加载旧的 config.json
    let old_config_path = config_dir.join("config.json");
    if old_config_path.exists() {
        // 简单读取 JSON 文件并提取需要的字段
        if let Ok(content) = fs::read_to_string(&old_config_path) {
            // 使用简单的字符串解析提取字段
            for line in content.lines() {
                let line = line.trim();
                if line.starts_with("user_token:") {
                    unified_config.user_token = line.split(':').nth(1).unwrap_or("").trim().to_string();
                } else if line.starts_with("frp_token:") {
                    unified_config.frp_token = line.split(':').nth(1).unwrap_or("").trim().to_string();
                } else if line.starts_with("username:") && !line.contains("user_info:") {
                    unified_config.username = line.split(':').nth(1).unwrap_or("").trim().to_string();
                } else if line.starts_with("group:") {
                    unified_config.group = line.split(':').nth(1).unwrap_or("").trim().to_string();
                }
            }
        }
    }

    // 尝试加载旧的 settings.json
    let old_settings_path = config_dir.join("settings.json");
    if old_settings_path.exists() {
        if let Ok(settings_content) = fs::read_to_string(&old_settings_path) {
            // 尝试解析为 JSON
            if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&settings_content) {
                if let Some(auto_start) = settings.get("auto_start").and_then(|v| v.as_bool()) {
                    unified_config.auto_start = auto_start;
                }
                if let Some(always_on_top) = settings.get("always_on_top").and_then(|v| v.as_bool()) {
                    unified_config.always_on_top = always_on_top;
                }
                if let Some(auto_update) = settings.get("auto_update").and_then(|v| v.as_bool()) {
                    unified_config.auto_update = auto_update;
                }
                if let Some(auto_start_tunnels) = settings.get("auto_start_tunnels").and_then(|v| v.as_array()) {
                    unified_config.auto_start_tunnels = auto_start_tunnels
                        .iter()
                        .filter_map(|v| v.as_i64().map(|n| n as i32))
                        .collect();
                }
                if let Some(startup_delay) = settings.get("startup_delay").and_then(|v| v.as_u64()) {
                    unified_config.startup_delay = startup_delay as i32;
                }
                if let Some(minimize_to_tray) = settings.get("minimize_to_tray").and_then(|v| v.as_bool()) {
                    unified_config.minimize_to_tray = minimize_to_tray;
                }
            }
        }
    }

    // 保存统一配置
    save_unified_config(&unified_config).await?;

    // 删除旧配置文件
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
