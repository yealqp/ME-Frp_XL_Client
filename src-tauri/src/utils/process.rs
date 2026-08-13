//! 进程管理共享工具函数
//!
//! 提供通用的进程 spawn、stop、日志捕获等函数，
//! 供 tunnel/process.rs 和 webui/mod.rs 复用。

use std::collections::VecDeque;
use std::io::{BufRead, BufReader};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};

/// 获取当前可执行文件所在目录
pub fn exe_dir() -> Result<PathBuf, String> {
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {e}"))?;
    let parent = exe_path.parent().ok_or_else(|| "无法获取可执行文件目录".to_string())?;
    Ok(parent.to_path_buf())
}

/// 启动进程并捕获 stdout/stderr 日志
///
/// 返回 (Child, 日志存储 Arc)，日志通过后台线程持续收集。
/// 自动设置 pipeline stdout/stderr 并在 Windows 上隐藏命令行窗口。
/// 日志环形缓冲上限为 1000 行，超出时丢弃最旧行（VecDeque 队首弹出 O(1)）。
pub fn spawn_and_capture(
    command: &mut Command,
    label: &str,
) -> Result<(Child, Arc<Mutex<VecDeque<String>>>), String> {
    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let mut child = command.spawn().map_err(|e| format!("启动{label}失败: {e}"))?;

    let logs = Arc::new(Mutex::new(VecDeque::new()));

    let stdout = child.stdout.take().ok_or(format!("无法获取{label}进程stdout"))?;
    let stderr = child.stderr.take().ok_or(format!("无法获取{label}进程stderr"))?;

    // 异步读取 stdout
    let logs_stdout = logs.clone();
    tokio::task::spawn_blocking(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            if let Ok(mut logs) = logs_stdout.lock() {
                logs.push_back(line);
                if logs.len() > 1000 {
                    logs.pop_front();
                }
            }
        }
    });

    // 异步读取 stderr
    let logs_stderr = logs.clone();
    tokio::task::spawn_blocking(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            if let Ok(mut logs) = logs_stderr.lock() {
                logs.push_back(format!("[ERR] {line}"));
                if logs.len() > 1000 {
                    logs.pop_front();
                }
            }
        }
    });

    Ok((child, logs))
}

/// 停止子进程（kill + wait）
///
/// 进程已自行退出（崩溃/正常结束）时视为停止成功，不报错；
/// 仅当 kill 本身真正失败时才返回错误。
pub fn stop_child(child: &Arc<Mutex<Option<Child>>>) -> Result<(), String> {
    let mut child_guard = child
        .lock()
        .map_err(|e| format!("获取进程锁失败: {e}"))?;

    let Some(mut child) = child_guard.take() else {
        return Err("进程已经被终止".to_string());
    };

    // 先检查进程是否已自行退出，已退出则无需 kill
    match child.try_wait() {
        Ok(Some(_)) => {
            let _ = child.wait();
            return Ok(());
        }
        Ok(None) => {}
        Err(e) => return Err(format!("检查进程状态失败: {e}")),
    }

    match child.kill() {
        Ok(()) => {
            let _ = child.wait();
            Ok(())
        }
        // Windows 上对已结束的进程调用 kill 会返回 InvalidInput，视为已停止
        Err(e) if e.kind() == std::io::ErrorKind::InvalidInput => {
            let _ = child.wait();
            Ok(())
        }
        Err(e) => Err(format!("终止进程失败: {e}")),
    }
}
