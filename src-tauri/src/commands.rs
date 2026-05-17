use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct ScannedFile {
    nome: String,
    caminho: String,
}

#[derive(Serialize)]
pub struct ScannedCliente {
    nome: String,
    pasta: String,
    ficheiros: Vec<ScannedFile>,
}

fn walk(dir: &Path, out: &mut Vec<ScannedFile>) {
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let ft = match entry.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        let path = entry.path();
        if ft.is_dir() {
            walk(&path, out);
        } else if ft.is_file() {
            out.push(ScannedFile {
                nome: entry.file_name().to_string_lossy().to_string(),
                caminho: path.to_string_lossy().to_string(),
            });
        }
    }
}

#[tauri::command]
pub async fn scan_root(root: String) -> Result<Vec<ScannedCliente>, String> {
    tokio::task::spawn_blocking(move || -> Result<Vec<ScannedCliente>, String> {
        let root_path = PathBuf::from(&root);
        let entries = std::fs::read_dir(&root_path).map_err(|e| e.to_string())?;
        let top_dirs: Vec<(String, PathBuf)> = entries
            .flatten()
            .filter_map(|e| {
                let ft = e.file_type().ok()?;
                if !ft.is_dir() {
                    return None;
                }
                Some((e.file_name().to_string_lossy().to_string(), e.path()))
            })
            .collect();

        let mut clientes: Vec<ScannedCliente> = std::thread::scope(|s| {
            let handles: Vec<_> = top_dirs
                .iter()
                .map(|(nome, path)| {
                    s.spawn(move || {
                        let mut ficheiros = Vec::new();
                        walk(path, &mut ficheiros);
                        ScannedCliente {
                            nome: nome.clone(),
                            pasta: path.to_string_lossy().to_string(),
                            ficheiros,
                        }
                    })
                })
                .collect();
            handles.into_iter().map(|h| h.join().unwrap()).collect()
        });

        clientes.sort_by(|a, b| a.nome.to_lowercase().cmp(&b.nome.to_lowercase()));
        Ok(clientes)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn open_data_folder(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let path_str = dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(path_str)
}

#[derive(Serialize)]
pub struct DbInfo {
    caminho: String,
    tamanho_bytes: u64,
}

#[tauri::command]
pub fn db_info(app: AppHandle) -> Result<DbInfo, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let src: PathBuf = dir.join("lextimer.db");
    let tamanho_bytes = std::fs::metadata(&src).map(|m| m.len()).unwrap_or(0);
    Ok(DbInfo {
        caminho: src.to_string_lossy().to_string(),
        tamanho_bytes,
    })
}

#[tauri::command]
pub fn backup_db(app: AppHandle, destination: String) -> Result<(), String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let src: PathBuf = dir.join("lextimer.db");
    std::fs::copy(&src, &destination).map_err(|e| e.to_string())?;
    Ok(())
}
