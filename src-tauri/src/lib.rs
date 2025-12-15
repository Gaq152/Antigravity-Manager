mod models;
mod modules;
mod commands;
mod utils;
pub mod error;

use modules::logger;

// 测试命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    logger::init_logger();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            modules::tray::create_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                #[cfg(target_os = "macos")]
                {
                    use tauri::Manager;
                    window.app_handle().set_activation_policy(tauri::ActivationPolicy::Accessory).unwrap_or(());
                }
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // 账号管理命令
            commands::list_accounts,
            commands::add_account,
            commands::delete_account,
            commands::switch_account,
            commands::get_current_account,
            // 配额命令
            commands::fetch_account_quota,
            commands::refresh_all_quotas,
            // 配置命令
            commands::load_config,
            commands::save_config,
            // 新增命令
            commands::start_oauth_login,
            commands::import_v1_accounts,
            commands::import_from_db,
            commands::save_text_file,
            commands::clear_log_cache,
            commands::open_data_folder,
            commands::show_main_window,
            commands::get_antigravity_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
