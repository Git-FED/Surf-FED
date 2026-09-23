# FED-EDU architecture

`apps/web` is the current React + Vite application shell. `apps/mobile` packages the same web build with Capacitor. `packages/*` are reserved shared modules. `supabase` contains the initial database and authorization scaffolding. The existing Electron/Tauri Surf FED browser remains unchanged and continues to live under `electron/` and `tauri/`.
