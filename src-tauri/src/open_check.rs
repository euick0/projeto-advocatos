use std::path::Path;

#[cfg(windows)]
mod platform {
    use windows_sys::Win32::Foundation::{BOOL, HWND, LPARAM, TRUE};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible,
    };

    pub fn list_titles() -> Vec<String> {
        let mut titles: Vec<String> = Vec::new();
        unsafe {
            EnumWindows(Some(enum_proc), &mut titles as *mut _ as LPARAM);
        }
        titles
    }

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let titles = unsafe { &mut *(lparam as *mut Vec<String>) };
        if unsafe { IsWindowVisible(hwnd) } == 0 {
            return TRUE;
        }
        let len = unsafe { GetWindowTextLengthW(hwnd) };
        if len <= 0 {
            return TRUE;
        }
        let mut buf = vec![0u16; (len + 1) as usize];
        let n = unsafe { GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32) };
        if n > 0 {
            titles.push(String::from_utf16_lossy(&buf[..n as usize]));
        }
        TRUE
    }
}

#[cfg(not(windows))]
mod platform {
    pub fn list_titles() -> Vec<String> {
        Vec::new()
    }
}

fn is_office_ext(ext: &str) -> bool {
    matches!(
        ext,
        "docx" | "doc" | "docm" | "dotx" | "dotm"
            | "xlsx" | "xls" | "xlsm" | "xlsb" | "xltx" | "xltm"
            | "pptx" | "ppt" | "pptm" | "potx" | "potm"
    )
}

fn office_lock_present(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !is_office_ext(&ext) {
        return false;
    }
    let basename = match path.file_name().and_then(|s| s.to_str()) {
        Some(b) => b,
        None => return false,
    };
    let parent = match path.parent() {
        Some(p) => p,
        None => return false,
    };
    parent.join(format!("~${}", basename)).exists()
}

fn title_matches(titles_lc: &[String], path: &Path) -> bool {
    let name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
    if name.len() < 4 {
        return false;
    }
    let name_lc = name.to_lowercase();
    let stem_lc = path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase());
    titles_lc.iter().any(|t| {
        if t.contains(&name_lc) {
            return true;
        }
        // Office strips extension from title ("Document - Word").
        if let Some(stem) = &stem_lc {
            if stem.len() >= 4 && t.contains(stem) {
                return true;
            }
        }
        false
    })
}

pub fn is_open(path: &Path, titles_lc: &[String]) -> bool {
    if office_lock_present(path) {
        return true;
    }
    title_matches(titles_lc, path)
}

#[tauri::command]
pub async fn query_open_files(paths: Vec<String>) -> Result<Vec<String>, String> {
    tokio::task::spawn_blocking(move || {
        let titles_lc: Vec<String> = platform::list_titles()
            .into_iter()
            .map(|t| t.to_lowercase())
            .collect();
        let mut open = Vec::new();
        for p in paths {
            let path = Path::new(&p);
            if is_open(path, &titles_lc) {
                open.push(p);
            }
        }
        Ok(open)
    })
    .await
    .map_err(|e| e.to_string())?
}
