//! 隧道管理模块
//!
//! 本模块负责隧道进程的启动、停止、日志管理和配置文件管理

pub mod config_file;
pub mod process;

// 重导出常用类型和函数
pub use process::{
    get_running_tunnels, get_tunnel_logs, start_tunnel, stop_tunnel, ProcessManager,
};

pub use config_file::{check_tunnel_config_files, delete_config_file, save_config_file};
