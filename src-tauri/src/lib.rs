mod ai_agents;
mod github;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ai_agents::discover_ai_agents,
            ai_agents::discover_ai_agent_models,
            ai_agents::chat_with_ai_agent,
            github::credentials::save_github_credential,
            github::credentials::read_github_credential,
            github::credentials::remove_github_credential,
            github::device_auth::start_github_device_authorization,
            github::device_auth::complete_github_device_authorization,
            github::device_auth::refresh_github_token,
            github::repositories::list_github_repositories,
            github::repositories::get_github_account
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
