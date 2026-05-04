/// 隧道相关数据结构模块
///
/// 包含隧道进程信息的结构体定义
use std::collections::HashMap;
use std::process::Child;
use std::sync::{Arc, Mutex};

/// 隧道进程信息
///
/// 存储单个隧道进程的运行状态、子进程句柄和日志信息
#[derive(Debug, Clone)]
pub struct TunnelProcess {
    #[allow(dead_code)]
    pub proxy_id: i32,
    pub child: Arc<Mutex<Option<Child>>>,
    pub logs: Arc<Mutex<Vec<String>>>,
}

/// 全局进程管理器类型别名
///
/// 用于管理所有运行中的隧道进程，Key为proxy_id，Value为TunnelProcess
pub type ProcessManager = Arc<Mutex<HashMap<i32, TunnelProcess>>>;
