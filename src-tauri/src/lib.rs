mod commands;
mod open_check;
mod watcher;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "remove_language_setting",
            sql: include_str!("../migrations/0002_remove_language.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_default_rule",
            sql: include_str!("../migrations/0003_add_default_rule.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "cobrancas",
            sql: include_str!("../migrations/0004_cobrancas.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "correcao_ajustes",
            sql: include_str!("../migrations/0005_correcao_ajustes.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:lextimer.db", migrations)
                .build(),
        )
        .manage(watcher::WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            commands::open_data_folder,
            commands::backup_db,
            commands::db_info,
            commands::scan_root,
            watcher::start_watching,
            watcher::stop_watching,
            open_check::query_open_files,
        ])
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "Abrir", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let icon = app.default_window_icon().cloned().unwrap();

            TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("LexTimer")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
