# Deployment

GitHub Actions is the source of truth for release builds. A version tag matching `v*` starts the release workflow. The workflow is configured to fail independently per operating-system job and to reject missing artifact paths.

Windows requires both portable and NSIS outputs. Linux requires AppImage and Debian outputs. Electron macOS requires arm64 and x64 DMGs when the matrix is expanded. Tauri mobile builds require Apple and Android signing credentials that must be stored as GitHub Actions secrets, never committed to this repository.

Until those credentials and the seventh target are configured, release notes must say which artifacts are unsigned or unavailable. A green workflow that omitted an artifact is not an acceptable release.
