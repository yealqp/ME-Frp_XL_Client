//! 隧道配置文件管理模块
//!
//! 本模块负责隧道配置文件的保存、删除和检查功能

use std::fs;

/// 保存配置文件到本地
///
/// 将配置内容保存到可执行文件所在目录，与启动隧道时的路径保持一致
///
/// # 参数
/// * `file_name` - 配置文件名
/// * `content` - 配置文件内容
///
/// # 返回
/// * `Ok(String)` - 成功消息，包含保存路径
/// * `Err(String)` - 错误消息
pub async fn save_config_file(file_name: String, content: String) -> Result<String, String> {
    // 使用可执行文件所在目录，与启动隧道时的路径保持一致
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {e}"))?;
    let exe_dir = exe_path.parent().ok_or("无法获取可执行文件目录")?;

    let config_file_path = exe_dir.join(&file_name);

    fs::write(&config_file_path, content).map_err(|e| format!("保存配置文件失败: {e}"))?;

    Ok(format!("配置文件已保存到: {}", config_file_path.display()))
}

/// 删除配置文件
///
/// 从可执行文件所在目录删除指定的配置文件
///
/// # 参数
/// * `file_name` - 配置文件名
///
/// # 返回
/// * `Ok(String)` - 成功消息
/// * `Err(String)` - 错误消息
pub async fn delete_config_file(file_name: String) -> Result<String, String> {
    // 使用可执行文件所在目录，与启动隧道时的路径保持一致
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {e}"))?;
    let exe_dir = exe_path.parent().ok_or("无法获取可执行文件目录")?;

    let config_file_path = exe_dir.join(&file_name);

    if config_file_path.exists() {
        fs::remove_file(&config_file_path).map_err(|e| format!("删除配置文件失败: {e}"))?;
        Ok(format!("配置文件已删除: {file_name}"))
    } else {
        Ok(format!("配置文件不存在: {file_name}"))
    }
}

/// 检查隧道是否有配置文件
///
/// 扫描可执行文件所在目录，查找所有隧道配置文件（支持 toml, json, yml, ini 格式）
///
/// # 返回
/// * `Ok(Vec<i32>)` - 拥有配置文件的隧道ID列表
/// * `Err(String)` - 错误消息
pub async fn check_tunnel_config_files() -> Result<Vec<i32>, String> {
    // 使用可执行文件所在目录，与启动隧道时的路径保持一致
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {e}"))?;
    let exe_dir = exe_path.parent().ok_or("无法获取可执行文件目录")?;

    let config_formats = ["toml", "json", "yml", "ini"];
    let mut tunnels_with_config = Vec::new();

    // 读取目录中的所有文件
    let entries = fs::read_dir(exe_dir).map_err(|e| format!("读取目录失败: {e}"))?;

    for entry in entries.flatten() {
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        // 检查文件名是否匹配隧道配置文件格式
        for format in &config_formats {
            if file_name_str.ends_with(&format!(".{format}")) {
                let name_without_ext = file_name_str.trim_end_matches(&format!(".{format}"));
                if let Ok(tunnel_id) = name_without_ext.parse::<i32>() {
                    if !tunnels_with_config.contains(&tunnel_id) {
                        tunnels_with_config.push(tunnel_id);
                    }
                }
            }
        }
    }

    Ok(tunnels_with_config)
}
