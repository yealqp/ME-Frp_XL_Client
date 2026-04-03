//! 版本更新管理模块
//!
//! 本模块负责应用的版本检查和更新功能。
//!
//! ## 功能
//! - 获取应用版本号
//! - 检查远程更新
//! - 下载并安装更新
//! - 版本号比较

use crate::models::api::{ChangelogResponse, RemoteVersion, VersionCheckResult};
use crate::utils::{create_http_client, CURRENT_VERSION};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::io::Write;
use std::process::Command;

/// 获取应用版本号
///
/// # 返回
/// 当前应用的版本号字符串
pub fn get_app_version() -> String {
    CURRENT_VERSION.to_string()
}

/// 获取版本信息和更新日志
///
/// 从远程服务器获取版本信息和完整的更新日志。
///
/// # 返回
/// - `Ok((RemoteVersion, HashMap<String, Vec<String>>))`: 版本信息和完整更新日志
/// - `Err(String)`: 获取失败的错误信息
async fn fetch_version_and_changelog() -> Result<(RemoteVersion, HashMap<String, Vec<String>>), String> {
    let client = create_http_client();

    // 并行请求版本信息和更新日志
    let version_future = client.get("https://check.yealqp.cn/xl.json").send();
    let changelog_future = client.get("https://check.yealqp.cn/tpca.json").send();

    let (version_response, changelog_response) = tokio::try_join!(
        async { version_future.await.map_err(|e| format!("请求版本信息失败: {e}")) },
        async { changelog_future.await.map_err(|e| format!("请求更新日志失败: {e}")) }
    )?;

    if !version_response.status().is_success() {
        return Err(format!("获取版本信息失败，状态码: {:?}", version_response.status()));
    }

    let remote_version: RemoteVersion = version_response
        .json()
        .await
        .map_err(|e| format!("解析版本信息失败: {e}"))?;

    // 解析完整的更新日志
    let full_changelog = if changelog_response.status().is_success() {
        changelog_response
            .json::<ChangelogResponse>()
            .await
            .map(|r| r.data)
            .unwrap_or_default()
    } else {
        HashMap::new()
    };

    Ok((remote_version, full_changelog))
}

/// 检查版本更新
///
/// 从远程服务器获取最新版本信息，并与当前版本比较。
/// 只返回差异版本的更新日志。
///
/// # 返回
/// - `Ok(VersionCheckResult)`: 版本检查结果，包含当前版本、最新版本、是否有更新等信息
/// - `Err(String)`: 检查失败的错误信息
pub async fn check_for_updates() -> Result<VersionCheckResult, String> {
    let (remote_version, full_changelog) = fetch_version_and_changelog().await?;

    let current_version = CURRENT_VERSION.to_string();
    let latest_version = remote_version.version;
    let update_info = remote_version.updateinfo;

    // 比较版本号
    let has_update = compare_versions(&current_version, &latest_version);

    // 筛选出差异版本的更新日志（只包含当前版本之后的版本）
    let changelog = filter_changelog_by_version(&full_changelog, &current_version, &latest_version);

    Ok(VersionCheckResult {
        current_version,
        latest_version,
        has_update,
        update_info,
        changelog,
    })
}

/// 获取完整的更新历史
///
/// 从远程服务器获取所有版本的更新日志。
///
/// # 返回
/// - `Ok(VersionCheckResult)`: 包含完整更新历史的版本检查结果
/// - `Err(String)`: 获取失败的错误信息
pub async fn get_update_history() -> Result<VersionCheckResult, String> {
    let (remote_version, full_changelog) = fetch_version_and_changelog().await?;

    let current_version = CURRENT_VERSION.to_string();
    let latest_version = remote_version.version;
    let update_info = remote_version.updateinfo;

    // 比较版本号
    let has_update = compare_versions(&current_version, &latest_version);

    Ok(VersionCheckResult {
        current_version,
        latest_version,
        has_update,
        update_info,
        changelog: full_changelog, // 返回完整的更新日志
    })
}

/// 筛选更新日志，只返回当前版本之后的版本日志
///
/// # 参数
/// - `full_changelog`: 完整的更新日志
/// - `current_version`: 当前版本号
/// - `latest_version`: 最新版本号
///
/// # 返回
/// 筛选后的更新日志，只包含当前版本之后的版本
fn filter_changelog_by_version(
    full_changelog: &HashMap<String, Vec<String>>,
    current_version: &str,
    latest_version: &str,
) -> HashMap<String, Vec<String>> {
    let mut filtered = HashMap::new();

    for (version, changes) in full_changelog {
        // 如果版本号大于当前版本且小于等于最新版本，则包含该版本的更新日志
        if compare_versions(current_version, version) && !compare_versions(latest_version, version) {
            filtered.insert(version.clone(), changes.clone());
        }
        // 如果版本号等于最新版本，也包含
        if version == latest_version {
            filtered.insert(version.clone(), changes.clone());
        }
    }

    filtered
}

/// 下载并安装更新
///
/// 从远程服务器下载指定版本的安装程序并启动安装。
///
/// # 参数
/// - `version`: 要下载的版本号
///
/// # 返回
/// - `Ok(String)`: 安装程序启动成功的消息
/// - `Err(String)`: 下载或安装失败的错误信息
///
/// # 平台支持
/// - Windows: 支持
/// - 其他平台: 暂不支持
pub async fn download_and_install_update(version: String) -> Result<String, String> {
    let client = create_http_client();

    // 构建下载URL
    let download_url = format!(
        "https://alist.yealqp.cn/download/ME-Frp%20XL%20Client/ME-Frp%20XL%20Client_{version}_x64-setup.exe"
    );

    // 获取临时目录
    let temp_dir = env::temp_dir();
    let installer_path = temp_dir.join(format!("ME-Frp_XL_{version}_setup.exe"));

    // 下载文件
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("下载失败: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("下载失败，状态码: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取下载内容失败: {e}"))?;

    // 保存到临时文件，使用作用域确保文件句柄被关闭
    {
        let mut file =
            fs::File::create(&installer_path).map_err(|e| format!("创建安装文件失败: {e}"))?;

        file.write_all(&bytes)
            .map_err(|e| format!("写入安装文件失败: {e}"))?;

        // 显式刷新并关闭文件
        file.sync_all().map_err(|e| format!("同步文件失败: {e}"))?;
    } // file 在这里被 drop，确保文件句柄关闭

    // 执行安装程序
    #[cfg(windows)]
    {
        Command::new(&installer_path)
            .spawn()
            .map_err(|e| format!("启动安装程序失败: {e}"))?;
    }

    #[cfg(not(windows))]
    {
        return Err("当前仅支持 Windows 平台自动更新".to_string());
    }

    Ok(format!("安装程序已启动: {}", installer_path.display()))
}

/// 版本号比较函数
///
/// 比较两个版本号，判断是否有新版本。
///
/// # 参数
/// - `current`: 当前版本号（格式: x.y.z）
/// - `latest`: 最新版本号（格式: x.y.z）
///
/// # 返回
/// - `true`: 最新版本号大于当前版本号
/// - `false`: 最新版本号小于或等于当前版本号
pub fn compare_versions(current: &str, latest: &str) -> bool {
    // 简单的版本号比较，假设格式为 x.y.z
    let current_parts: Vec<u32> = current.split('.').filter_map(|s| s.parse().ok()).collect();

    let latest_parts: Vec<u32> = latest.split('.').filter_map(|s| s.parse().ok()).collect();

    // 确保两个版本号都有至少3个部分
    if current_parts.len() < 3 || latest_parts.len() < 3 {
        return current != latest;
    }

    // 比较主版本号
    if latest_parts[0] > current_parts[0] {
        return true;
    } else if latest_parts[0] < current_parts[0] {
        return false;
    }

    // 比较次版本号
    if latest_parts[1] > current_parts[1] {
        return true;
    } else if latest_parts[1] < current_parts[1] {
        return false;
    }

    // 比较修订版本号
    latest_parts[2] > current_parts[2]
}
