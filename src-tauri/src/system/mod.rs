//! 系统设置模块
//!
//! 本模块负责系统级功能，包括：
//! - window: 窗口管理
//! - startup: 自动启动设置
//! - update: 版本更新检查

pub mod startup;
pub mod update;
pub mod window;

// 重导出常用函数
pub use startup::set_auto_start;
pub use update::{
    check_for_updates, compare_versions, download_and_install_update, get_app_version,
};
pub use window::{hide_window, quit_app, set_always_on_top, set_minimize_to_tray, show_window};
