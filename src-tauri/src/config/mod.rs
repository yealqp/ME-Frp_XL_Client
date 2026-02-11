//! 配置管理模块
//!
//! 本模块负责应用配置的读取、保存和迁移功能

pub mod manager;

// 重导出配置管理函数
pub use manager::{
    clear_config, load_settings, load_unified_config, migrate_old_configs, read_config,
    save_config, save_settings, save_unified_config,
};
