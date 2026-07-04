//! 背景图片管理模块

use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

fn managed_background_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe().map_err(|e| format!("获取可执行文件路径失败: {e}"))?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "获取可执行文件目录失败".to_string())?;
    Ok(exe_dir.join("temp"))
}

fn managed_background_relative_path(file_name: &str) -> String {
    format!("temp/{file_name}")
}

fn managed_background_absolute_path(relative_path: &str) -> Result<PathBuf, String> {
    if !relative_path.starts_with("temp/") {
        return Err("非法的背景图片路径".to_string());
    }

    let file_name = relative_path.trim_start_matches("temp/");
    if file_name.is_empty()
        || file_name.contains('/')
        || file_name.contains('\\')
        || file_name.contains("..")
    {
        return Err("非法的背景图片路径".to_string());
    }

    let target_dir = managed_background_dir()?;
    Ok(target_dir.join(file_name))
}

fn unique_background_file_name(source: &Path) -> Result<String, String> {
    let stem = source
        .file_stem()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "无法解析图片文件名".to_string())?;
    let extension = source
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| format!(".{ext}"))
        .unwrap_or_default();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("获取时间戳失败: {e}"))?
        .as_millis();

    Ok(format!("{stem}-{timestamp}{extension}"))
}

pub async fn copy_background_image_to_temp(source_path: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("源图片不存在".to_string());
    }

    let file_name = unique_background_file_name(source)?;

    let target_dir = managed_background_dir()?;
    fs::create_dir_all(&target_dir).map_err(|e| format!("创建背景目录失败: {e}"))?;

    let target_path = target_dir.join(&file_name);
    fs::copy(source, &target_path).map_err(|e| format!("复制背景图片失败: {e}"))?;

    Ok(managed_background_relative_path(&file_name))
}

pub async fn remove_managed_background_image(relative_path: String) -> Result<(), String> {
    if !relative_path.starts_with("temp/") {
        return Ok(());
    }

    let target_path = managed_background_absolute_path(&relative_path)?;

    if target_path.exists() {
        fs::remove_file(&target_path).map_err(|e| format!("删除背景图片失败: {e}"))?;
    }

    Ok(())
}

pub async fn resolve_managed_background_image_path(relative_path: String) -> Result<String, String> {
    let target_path = managed_background_absolute_path(&relative_path)?;

    if !target_path.exists() {
        return Err("背景图片不存在".to_string());
    }

    Ok(target_path.to_string_lossy().into_owned())
}

fn managed_background_mime(target_path: &Path) -> &'static str {
    match target_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_ascii_lowercase())
        .as_deref()
    {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("jfif") => "image/jpeg",
        Some("png") => "image/png",
        Some("webp") => "image/webp",
        Some("avif") => "image/avif",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        _ => "image/png",
    }
}

pub async fn read_managed_background_image_data_url(relative_path: String) -> Result<String, String> {
    let target_path = managed_background_absolute_path(&relative_path)?;
    let bytes = fs::read(&target_path).map_err(|e| format!("读取背景图片失败: {e}"))?;
    let mime = managed_background_mime(&target_path);
    let encoded = STANDARD.encode(bytes);

    Ok(format!("data:{mime};base64,{encoded}"))
}

#[cfg(test)]
mod tests {
    use super::{managed_background_absolute_path, managed_background_mime};
    use std::path::Path;

    #[test]
    fn managed_background_mime_supports_extended_image_types() {
        assert_eq!(managed_background_mime(Path::new("wallpaper.avif")), "image/avif");
        assert_eq!(managed_background_mime(Path::new("wallpaper.svg")), "image/svg+xml");
        assert_eq!(managed_background_mime(Path::new("wallpaper.ico")), "image/x-icon");
        assert_eq!(managed_background_mime(Path::new("wallpaper.jfif")), "image/jpeg");
    }

    #[test]
    fn managed_background_absolute_path_restricts_to_temp_directory() {
        let path = managed_background_absolute_path("temp/wallpaper.jpeg")
            .expect("managed temp path should resolve");

        assert!(path.ends_with(Path::new("temp").join("wallpaper.jpeg")));
        assert!(managed_background_absolute_path("wallpaper.jpeg").is_err());
        assert!(managed_background_absolute_path("temp/../wallpaper.jpeg").is_err());
        assert!(managed_background_absolute_path("temp/foo/bar.jpeg").is_err());
        assert!(managed_background_absolute_path("temp\\wallpaper.jpeg").is_err());
    }
}
