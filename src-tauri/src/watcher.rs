use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

#[derive(Default)]
pub struct WatcherState {
    pub watcher: Mutex<Option<RecommendedWatcher>>,
}

#[derive(Serialize, Clone)]
struct FileEvent {
    kind: String,
    path: String,
    timestamp_ms: i64,
}

fn classify(kind: &EventKind) -> Option<&'static str> {
    match kind {
        EventKind::Access(_) => Some("access"),
        EventKind::Modify(_) => Some("modify"),
        EventKind::Create(_) => Some("create"),
        EventKind::Remove(_) => Some("remove"),
        _ => None,
    }
}

#[tauri::command]
pub fn start_watching(
    app: AppHandle,
    state: State<'_, WatcherState>,
    root: String,
) -> Result<(), String> {
    let mut guard = state.watcher.lock().map_err(|e| e.to_string())?;
    *guard = None;

    let app_clone = app.clone();
    let mut watcher: RecommendedWatcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
        if let Ok(event) = res {
            if let Some(kind) = classify(&event.kind) {
                for path in event.paths {
                    let fe = FileEvent {
                        kind: kind.to_string(),
                        path: path.to_string_lossy().to_string(),
                        timestamp_ms: chrono::Utc::now().timestamp_millis(),
                    };
                    let _ = app_clone.emit("file-event", fe);
                }
            }
        }
    })
    .map_err(|e| e.to_string())?;

    let path = PathBuf::from(&root);
    watcher
        .configure(Config::default().with_poll_interval(Duration::from_secs(2)))
        .map_err(|e| e.to_string())?;
    watcher
        .watch(&path, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *guard = Some(watcher);
    Ok(())
}

#[tauri::command]
pub fn stop_watching(state: State<'_, WatcherState>) -> Result<(), String> {
    let mut guard = state.watcher.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}
