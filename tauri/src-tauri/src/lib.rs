mod audio;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![audio::default_mute_enabled])
        .run(tauri::generate_context!())
        .expect("error while running Surf FED");
}
