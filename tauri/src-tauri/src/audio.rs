use tauri::command;

/// Returns the default mobile audio policy. Device-specific WebKit muting is wired here.
#[command]
pub fn default_mute_enabled() -> bool {
    true
}
