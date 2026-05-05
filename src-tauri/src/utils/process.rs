//! 进程管理共享工具函数
//!
//! 提供通用的进程 spawn、stop、日志捕获等函数，
//! 供 tunnel/process.rs 和 webui/mod.rs 复用。

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
pub fn spawn_and_capture(
    command: &mut Command,
    label: &str,
) -> Result<(Child, Arc<Mutex<Vec<String>>>), String> {
    command.stdout(Stdio::piped()).stderr(Stdio::piped());

    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let mut child = command.spawn().map_err(|e| format!("启动{label}失败: {e}"))?;

    let logs = Arc::new(Mutex::new(Vec::new()));

    let stdout = child.stdout.take().ok_or(format!("无法获取{label}进程stdout"))?;
    let stderr = child.stderr.take().ok_or(format!("无法获取{label}进程stderr"))?;

    // 异步读取 stdout
    let logs_stdout = logs.clone();
    tokio::task::spawn_blocking(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            if let Ok(mut logs) = logs_stdout.lock() {
                logs.push(line);
                if logs.len() > 1000 {
                    logs.remove(0);
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
                logs.push(format!("[ERR] {line}"));
                if logs.len() > 1000 {
                    logs.remove(0);
                }
            }
        }
    });

    Ok((child, logs))
}

/// 停止子进程（kill + wait）
pub fn stop_child(child: &Arc<Mutex<Option<Child>>>) -> Result<(), String> {
    let mut child_guard = child
        .lock()
        .map_err(|e| format!("获取进程锁失败: {e}"))?;
    if let Some(mut child) = child_guard.take() {
        child.kill().map_err(|e| format!("终止进程失败: {e}"))?;
        let _ = child.wait();
        Ok(())
    } else {
        Err("进程已经被终止".to_string())
    }
}
