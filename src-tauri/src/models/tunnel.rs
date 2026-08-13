/// 隧道相关数据结构模块
///
/// 包含隧道进程信息的结构体定义
use std::collections::{HashMap, VecDeque};
use std::process::Child;
use std::sync::{Arc, Mutex};

/// 隧道进程信息
///
/// 存储单个隧道进程的运行状态、子进程句柄和日志信息
#[derive(Debug, Clone)]
pub struct TunnelProcess {
    pub child: Arc<Mutex<Option<Child>>>,
    /// 环形日志缓冲（上限由写入方控制），VecDeque 保证队首弹出为 O(1)
    pub logs: Arc<Mutex<VecDeque<String>>>,
}

/// 全局进程管理器类型别名
///
/// 用于管理所有运行中的隧道进程，Key为proxy_id，Value为TunnelProcess
pub type ProcessManager = Arc<Mutex<HashMap<i32, TunnelProcess>>>;
