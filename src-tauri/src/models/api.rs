//! API响应相关数据结构
//!
//! 本模块定义了与API响应和版本管理相关的数据结构：
//! - RemoteVersion: 远程版本信息
//! - VersionCheckResult: 版本检查结果
//! - ChangelogResponse: 更新日志响应
//! - FrpTokenData: FRP Token数据

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 远程版本信息结构体
///
/// 用于存储从远程服务器获取的版本信息
#[derive(Serialize, Deserialize, Debug)]
pub struct RemoteVersion {
    /// 版本号
    pub version: String,
    /// 更新信息列表
    #[serde(default)]
    pub updateinfo: Vec<String>,
}

/// 版本检查结果结构体
///
/// 用于存储版本检查的结果信息
#[derive(Serialize, Deserialize, Debug)]
pub struct VersionCheckResult {
    /// 当前版本号
    pub current_version: String,
    /// 最新版本号
    pub latest_version: String,
    /// 是否有更新
    pub has_update: bool,
    /// 更新信息列表
    pub update_info: Vec<String>,
    /// 更新日志 (版本号 -> 更新内容列表)
    #[serde(default)]
    pub changelog: HashMap<String, Vec<String>>,
}

/// 单个版本的更新日志条目
///
/// 兼容两种格式：
/// - 对象格式 `{ "date": ..., "changes": [...] }`（server/tpca.json 当前格式）
/// - 数组格式 `["change1", "change2", ...]`
#[derive(Deserialize, Debug)]
#[serde(untagged)]
pub enum ChangelogEntry {
    Object {
        date: Option<String>,
        changes: Vec<String>,
    },
    Array(Vec<String>),
}

impl ChangelogEntry {
    /// 提取该版本的更新内容列表
    pub fn changes(&self) -> Vec<String> {
        match self {
            ChangelogEntry::Object { changes, .. } => changes.clone(),
            ChangelogEntry::Array(items) => items.clone(),
        }
    }
}

/// 更新日志响应结构体
///
/// 用于解析 tpca.json 的响应格式
#[derive(Deserialize, Debug)]
pub struct ChangelogResponse {
    /// 更新日志数据（版本号 -> 更新条目）
    pub data: HashMap<String, ChangelogEntry>,
}

/// FRP Token数据结构体
///
/// 用于存储FRP Token响应数据
#[derive(Serialize, Deserialize, Debug)]
pub struct FrpTokenData {
    /// FRP Token字符串
    pub token: String,
}

#[cfg(test)]
mod tests {
    use super::{ChangelogEntry, ChangelogResponse};
    use std::collections::HashMap;

    #[test]
    fn changelog_parses_object_format() {
        // server/tpca.json 当前格式：{ data: { "2.2.4": { date, changes } } }
        let json = r#"{
            "data": {
                "2.2.4": {
                    "date": "2026-07-06",
                    "changes": ["feat.新增功能", "refactor.优化代码"]
                }
            }
        }"#;

        let parsed: ChangelogResponse = serde_json::from_str(json).expect("对象格式应可解析");
        let entry = parsed.data.get("2.2.4").expect("应包含 2.2.4");
        assert_eq!(entry.changes(), vec!["feat.新增功能", "refactor.优化代码"]);
    }

    #[test]
    fn changelog_parses_array_format() {
        // 兼容旧格式：{ data: { "2.2.4": ["change1", "change2"] } }
        let json = r#"{
            "data": {
                "2.2.4": ["change1", "change2"]
            }
        }"#;

        let parsed: ChangelogResponse = serde_json::from_str(json).expect("数组格式应可解析");
        let entry = parsed.data.get("2.2.4").expect("应包含 2.2.4");
        assert_eq!(entry.changes(), vec!["change1", "change2"]);
    }

    #[test]
    fn changelog_entry_type_discrimination() {
        let obj: ChangelogEntry =
            serde_json::from_str(r#"{"date": "2026-01-01", "changes": ["a"]}"#)
                .expect("对象应解析");
        assert!(matches!(obj, ChangelogEntry::Object { .. }));
        assert_eq!(obj.changes(), vec!["a".to_string()]);

        let arr: ChangelogEntry = serde_json::from_str(r#"["a", "b"]"#).expect("数组应解析");
        assert!(matches!(arr, ChangelogEntry::Array(_)));
        assert_eq!(arr.changes(), vec!["a".to_string(), "b".to_string()]);
    }

    #[test]
    fn changelog_map_extracts_changes() {
        let json = r#"{
            "data": {
                "2.2.4": { "date": "2026-07-06", "changes": ["x"] },
                "2.2.3": ["y", "z"]
            }
        }"#;

        let parsed: ChangelogResponse = serde_json::from_str(json).expect("混合格式应可解析");
        let map: HashMap<String, Vec<String>> = parsed
            .data
            .into_iter()
            .map(|(version, entry)| (version, entry.changes()))
            .collect();

        assert_eq!(map.get("2.2.4"), Some(&vec!["x".to_string()]));
        assert_eq!(map.get("2.2.3"), Some(&vec!["y".to_string(), "z".to_string()]));
        assert_eq!(map.len(), 2);
    }
}
