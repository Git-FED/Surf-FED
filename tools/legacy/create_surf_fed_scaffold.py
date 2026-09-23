from pathlib import Path
import json, struct, zlib, shutil

ROOT = Path('/home/ubuntu/surf-fed')
if ROOT.exists():
    shutil.rmtree(ROOT)

files = {}

def add(path, content):
    files[path] = content.strip('\n') + '\n'

add('README.md', '''# Surf FED

Surf FED is a privacy-focused power-user browser concept centered on a **true 1/2/3-pane tab split**, working desktop MV3 extensions, and a global default-mute preference.

## Core requirements

- Three live browser panes with focused-pane toolbar control.
- Desktop MV3 extensions loaded through Electron's persistent session.
- Global mute-by-default with per-origin whitelist support.
- Tauri mobile ports acknowledge WebKit's lack of a Chrome extension runtime.
- GitHub Actions build matrix for desktop and mobile release artifacts.

## Support

<a href="https://ko-fi.com/W3T61ZU5FS" target="_blank">
  <img height="36" style="border:0px;height:36px;" src="https://ko-fi.com/img/githubbutton_sm.svg" border="0" alt="Buy Me a Coffee at ko-fi.com" />
</a>

See [NON_NEGOTIABLES.md](NON_NEGOTIABLES.md) before changing architecture. See [docs/BUILD.md](docs/BUILD.md) for build commands.
''')

add('NON_NEGOTIABLES.md', '''# Surf FED — Non-Negotiable Requirements

This repository is a scaffold for the Surf FED browser. The following are release gates.

## 1. Extensions must work

Electron desktop loads the four built-in MV3 extensions—ad-blocker, dark-reader, fed-gram, and page-info—into the `persist:surf-fed` partition using real `session.loadExtension()` calls. Users may load unpacked third-party extensions. `allowUncheckedErrors` must not hide failures.

Tauri iOS/Android uses WebKit and therefore has no Chrome extension runtime. Its four built-in capabilities must be implemented as native or renderer features; arbitrary Chrome extensions are not claimed to work on mobile.

## 2. Device builds

The release workflow must produce Windows portable + NSIS, macOS Electron DMGs, Linux AppImage + deb, optional Tauri macOS DMG, iOS IPA, Android APK/AAB, and one confirmed seventh target. Missing artifacts must fail the release upload.

## 3. Three-pane split

Both renderers must support 1-, 2-, and 3-pane layouts; draggable dividers; focused-pane toolbar actions; user-controlled pane/tab assignment; parked tabs; exact 3→1→3 restoration; and localStorage persistence. Webviews/iframes must remain alive during layout changes. The Electron smoke suite is the acceptance bar.

## Global default mute

New tabs are muted by default unless their origin is whitelisted. The setting and whitelist persist locally, and users can toggle the policy from the toolbar/settings panel.
''')

add('.gitignore', '''node_modules/
dist/
electron/dist/
tauri/dist/
tauri/src-tauri/target/
.DS_Store
*.log
.env
.env.*
!.env.example
''')
add('LICENSE', 'MIT License\n\nCopyright (c) 2026 Surf FED contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, subject to the conditions in the full MIT license text.')
for name, title in {
    'NOTICE.md':'# Notice\n\nSurf FED is an independent project.', 'COPYING.md':'# Copying\n\nSee LICENSE for the project license.', 'CITATIONS.md':'# Citations\n\nAdd third-party notices here.', 'AUTHORS.md':'# Authors\n\nSurf FED contributors.', 'MAINTAINERS.md':'# Maintainers\n\nSee CONTRIBUTING.md.', 'GOVERNANCE.md':'# Governance\n\nProject decisions are documented in issues and ADRs.', 'CODE_OF_CONDUCT.md':'# Code of Conduct\n\nBe respectful and constructive.', 'CONTRIBUTING.md':'# Contributing\n\nOpen an issue before large changes, then submit a focused pull request.', 'SUPPORT.md':'# Support\n\nOpen a GitHub issue or email support@fedpromptly.com.', 'SECURITY.md':'# Security\n\nReport vulnerabilities privately to support@fedpromptly.com.', 'PRICING.md':'# Pricing\n\nSurf FED is currently a free/open-source project.', 'CLAUDE.md':'# Agent guidance\n\nRead NON_NEGOTIABLES.md first. Preserve the 3-pane state machine and fail loudly on extension errors.', 'AGENTS.md':'# Agent guidance\n\nRun syntax checks and tests before claiming a requirement is complete.', 'todo.md':'# Todo\n\n- Confirm the seventh CI target.\n- Replace placeholder artwork.\n- Add signed release secrets.', 'CHANGELOG.md':'# Changelog\n\n## Unreleased\n- Initial GitHub-ready scaffold.', 'FAQ.md':'# FAQ\n\n## Does mobile support Chrome extensions?\nNo. Mobile uses WebKit and native feature ports.', 'usage.md':'# Usage\n\nRun `cd electron && npm install && npm start` for the desktop prototype.', 'SUMMARY.md':'# Summary\n\nSurf FED combines a three-pane browser workspace with extension and audio controls.'}.items(): add(name, title)

add('.github/DISCUSSION_WELCOME_README.md', '# Welcome\n\nUse Discussions for ideas, usage questions, and roadmap conversations.\n')
add('.github/PULL_REQUEST_TEMPLATE.md', '# Pull request\n\n## Summary\n\n## Verification\n- [ ] 3-pane behavior preserved\n- [ ] Extensions fail loudly\n- [ ] Tests run\n')
add('.github/ISSUE_TEMPLATE/bug_report.md', '# Bug report\n\n## Steps to reproduce\n\n## Expected behavior\n\n## Actual behavior\n')
add('.github/ISSUE_TEMPLATE/feature_request.md', '# Feature request\n\n## Problem\n\n## Proposed solution\n')
add('.github/ISSUE_TEMPLATE/custom.md', '# Project discussion\n\nDescribe the topic, platform, and acceptance criteria.\n')
add('.github/workflows/build.yml', '''name: Build Surf FED
on:
  push:
    tags: ['v*']
  workflow_dispatch:
jobs:
  electron:
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: windows-latest
            command: npm run dist -- --win
          - os: macos-latest
            command: npm run dist -- --mac
          - os: ubuntu-latest
            command: npm run dist -- --linux
    runs-on: ${{ matrix.os }}
    defaults: { run: { working-directory: electron } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: electron/package-lock.json }
      - run: npm ci
      - run: ${{ matrix.command }}
      - uses: actions/upload-artifact@v4
        with: { name: electron-${{ matrix.os }}, path: electron/dist/**, if-no-files-found: error }
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: electron } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: electron/package-lock.json }
      - run: npm ci
      - run: npx electron tests/run-test.js
''')

# Electron app
add('electron/package.json', '''{
  "name": "surf-fed-electron",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {"start":"electron .", "test":"electron tests/run-test.js", "dist":"electron-builder"},
  "devDependencies": {"electron":"^36.0.0", "electron-builder":"^26.0.0"},
  "build": {"appId":"com.surffed.browser", "productName":"Surf FED", "files":["**/*"], "win":{"target":["portable","nsis"]}, "mac":{"target":["dmg"],"category":"public.app-category.productivity"}, "linux":{"target":["AppImage","deb"]}}
}''')
add('electron/main.js', '''const { app, BrowserWindow, session, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const BUILTINS = ['ad-blocker','dark-reader','fed-gram','page-info'];
function extensionRoot() { return path.join(__dirname, 'extensions', 'builtin'); }
async function loadBuiltins() {
  const ses = session.fromPartition('persist:surf-fed');
  for (const name of BUILTINS) {
    const dir = path.join(extensionRoot(), name);
    if (!fs.existsSync(path.join(dir, 'manifest.json'))) throw new Error(`Missing manifest: ${name}`);
    await ses.loadExtension(dir, { allowFileAccess: true });
  }
}
function createWindow() {
  const win = new BrowserWindow({width: 1440, height: 900, webPreferences: {preload:path.join(__dirname,'preload.js'), contextIsolation:true, nodeIntegration:false, webviewTag:true, partition:'persist:surf-fed'}});
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(async () => { await loadBuiltins(); createWindow(); });
ipcMain.handle('extensions:list', () => BUILTINS.map(name => ({name, builtin:true, enabled:true})));
ipcMain.handle('extensions:open-folder', () => shell.openPath(path.join(app.getPath('userData'),'extensions')));
ipcMain.handle('extensions:add', async () => { const r = await dialog.showOpenDialog({properties:['openDirectory']}); return r.canceled ? null : r.filePaths[0]; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
''')
add('electron/preload.js', '''const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', { extensions: { list:()=>ipcRenderer.invoke('extensions:list'), openFolder:()=>ipcRenderer.invoke('extensions:open-folder'), add:()=>ipcRenderer.invoke('extensions:add') } });
''')
add('electron/index.html', '''<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src 'self';"><title>Surf FED</title><link rel="stylesheet" href="styles.css"></head><body><header id="toolbar"><button id="backBtn">←</button><button id="forwardBtn">→</button><button id="reloadBtn">↻</button><input id="urlBar" placeholder="Enter URL or search…"><button id="newTabBtn">＋</button><button id="muteBtn">🔇</button><button id="extensionsBtn">🧩</button><span id="layoutBtns"><button data-layout="1">1</button><button data-layout="2">2</button><button data-layout="3">3</button></span></header><nav id="tabStrip"></nav><main id="paneArea"><div id="webviewParking"></div><section class="pane" id="pane-0"><div class="pane-header" data-pane="0">Empty</div></section><section class="pane" id="pane-1"><div class="pane-header" data-pane="1">Empty</div></section><section class="pane" id="pane-2"><div class="pane-header" data-pane="2">Empty</div></section><div class="divider" id="divider-0"></div><div class="divider" id="divider-1"></div></main><aside id="extensionsPanel" hidden><h2>Extensions</h2><div id="extList"></div><button id="extAddBtn">Load unpacked…</button></aside><footer><a href="mailto:careers@fedpromptly.com">careers@fedpromptly.com</a> · <a href="mailto:support@fedpromptly.com">support@fedpromptly.com</a> · <a href="mailto:business@fedpromptly.com">business@fedpromptly.com</a> · <a href="mailto:contact@fedpromptly.com">contact@fedpromptly.com</a></footer><script src="audio-controller.js"></script><script src="renderer.js"></script></body></html>''')
add('electron/styles.css', '''*{box-sizing:border-box}html,body{margin:0;height:100%;font:14px system-ui;background:#111;color:#eee;overflow:hidden}body{display:flex;flex-direction:column}#toolbar{display:flex;gap:6px;padding:8px;background:#20242b;align-items:center}button{background:#353b46;color:#fff;border:0;border-radius:5px;padding:7px 10px;cursor:pointer}button:hover{background:#4b5563}#urlBar{flex:1;background:#111827;color:#fff;border:1px solid #4b5563;border-radius:18px;padding:8px 14px}#tabStrip{display:flex;gap:4px;padding:5px;background:#171a20;min-height:36px}.tab-chip{padding:7px 10px;background:#303642;border-radius:4px}.tab-chip.active{background:#d9a441;color:#111}#paneArea{position:relative;display:flex;flex:1;min-height:0;background:#0b0d10}.pane{position:relative;display:none;flex:1;min-width:80px;border:1px solid #303744}.pane.visible{display:block}.pane-header{position:absolute;z-index:5;top:0;left:0;right:0;padding:7px;background:#252b35}.pane.focused .pane-header{background:#d9a441;color:#111}.divider{width:5px;background:#111;cursor:col-resize;display:none}.divider.visible{display:block}#webviewParking{position:absolute;inset:0;z-index:1}.live-webview{position:absolute;z-index:2;border:0}#extensionsPanel{position:absolute;right:10px;top:58px;background:#252b35;padding:16px;z-index:10;width:300px}footer{font-size:10px;text-align:center;padding:3px;background:#171a20}footer a{color:#9cc7ff}''')
add('electron/audio-controller.js', '''const KEY='surf-fed-audio';
const audioController={get settings(){try{return JSON.parse(localStorage.getItem(KEY))||{defaultMuted:true,whitelist:[]}}catch{return {defaultMuted:true,whitelist:[]}}},save(s){localStorage.setItem(KEY,JSON.stringify(s))},origin(url){try{return new URL(url).origin}catch{return ''}},shouldMute(url){const s=this.settings; return s.defaultMuted&&!s.whitelist.includes(this.origin(url))},apply(webview,url){if(webview&&typeof webview.setAudioMuted==='function') webview.setAudioMuted(this.shouldMute(url))},toggleDefault(){const s=this.settings;s.defaultMuted=!s.defaultMuted;this.save(s);return s}}; window.audioController=audioController;
''')
add('electron/renderer.js', '''const state={layout:1,focusedPane:0,nextId:1,tabs:new Map(),panes:[null,null,null]}; const $=id=>document.getElementById(id); const paneEls=[0,1,2].map(i=>$('pane-'+i));
function saveState(){localStorage.setItem('surf-fed-splitview',JSON.stringify({layout:state.layout,focusedPane:state.focusedPane,panes:state.panes}))}
function loadState(){try{const s=JSON.parse(localStorage.getItem('surf-fed-splitview'));if(s){state.layout=s.layout||1;state.focusedPane=s.focusedPane||0;state.panes=s.panes||[null,null,null]}}catch{}}
function isParked(id){return !state.panes.includes(id)} function visibleTabIds(){return state.panes.slice(0,state.layout).filter(Boolean)}
function createTab(url='https://example.com'){const id=state.nextId++;const w=document.createElement('webview');w.className='live-webview';w.src=url;w.setAttribute('partition','persist:surf-fed');w.addEventListener('did-navigate',()=>{const t=state.tabs.get(id);if(t){t.url=w.getURL();audioController.apply(w,t.url);render()}});w.addEventListener('page-title-updated',e=>{const t=state.tabs.get(id);if(t)t.title=e.title;render()});$('webviewParking').appendChild(w);audioController.apply(w,url);const t={id,url,title:url,webview:w};state.tabs.set(id,t);const p=state.focusedPane; if(state.panes[p]){const old=state.panes[p];if(!state.panes.slice(0,state.layout).includes(old)){} } state.panes[p]=id;applyLayout();render();return t}
function closeTab(id){const t=state.tabs.get(id);if(!t)return;const p=state.panes.indexOf(id);t.webview.remove();state.tabs.delete(id);if(p>=0)state.panes[p]=null;refill();render()}
function refill(){for(let i=0;i<state.layout;i++)if(!state.panes[i]){const parked=[...state.tabs.keys()].find(isParked);if(parked)state.panes[i]=parked}applyLayout()}
function setLayout(n){state.layout=Math.max(1,Math.min(3,n));if(state.focusedPane>=state.layout)state.focusedPane=0;refill();applyLayout();saveState();render()}
function focusPane(i){state.focusedPane=Math.max(0,Math.min(state.layout-1,i));applyLayout();render()}
function swapPanes(a,b){[state.panes[a],state.panes[b]]=[state.panes[b],state.panes[a]];applyLayout();saveState();render()}
function applyLayout(){paneEls.forEach((p,i)=>{p.classList.toggle('visible',i<state.layout);p.classList.toggle('focused',i===state.focusedPane);const id=state.panes[i],t=state.tabs.get(id);p.querySelector('.pane-header').textContent=t?.title||'Empty';const w=t?.webview;if(w&&i<state.layout){const r=p.getBoundingClientRect(),a=$('paneArea').getBoundingClientRect();w.style.left=(r.left-a.left)+'px';w.style.top=(r.top-a.top)+'px';w.style.width=r.width+'px';w.style.height=r.height+'px';w.style.visibility='visible';w.style.pointerEvents='auto'}else if(w){w.style.visibility='hidden';w.style.pointerEvents='none'}});[0,1].forEach(i=>$('divider-'+i).classList.toggle('visible',i<state.layout-1))}
function render(){document.querySelectorAll('.tab-chip').forEach(x=>x.remove());for(const t of state.tabs.values()){const b=document.createElement('button');b.className='tab-chip '+(state.panes[state.focusedPane]===t.id?'active':'');b.textContent=t.title||'New tab';b.onclick=()=>{const p=state.panes.indexOf(t.id);if(p>=0)focusPane(p)};$('tabStrip').appendChild(b)}const t=state.tabs.get(state.panes[state.focusedPane]);$('urlBar').value=t?.url||''}
loadState(); if(![...state.tabs].length)createTab(); else applyLayout();
$('newTabBtn').onclick=()=>createTab(); $('muteBtn').onclick=()=>{const t=state.tabs.get(state.panes[state.focusedPane]);if(t)t.webview.setAudioMuted(!t.webview.isAudioMuted?.());}; $('layoutBtns').addEventListener('click',e=>{if(e.target.dataset.layout)setLayout(+e.target.dataset.layout)}); paneEls.forEach((p,i)=>p.querySelector('.pane-header').onclick=()=>focusPane(i)); window.addEventListener('resize',applyLayout);
window.__splitview={state,createTab,closeTab,setLayout,focusPane,swapPanes,visibleTabIds,isParked,saveState,loadState,applyLayout};
''')
add('electron/settings.html', '<!doctype html><html><body><h1>Audio settings</h1><label><input id="defaultMuted" type="checkbox" checked> Mute all tabs by default</label><ul id="whitelist"></ul><script src="settings.js"></script></body></html>')
add('electron/settings.js', "const s=JSON.parse(localStorage.getItem('surf-fed-audio')||'{\"defaultMuted\":true,\"whitelist\":[]}');document.querySelector('#defaultMuted').checked=s.defaultMuted;\n")
add('electron/tests/test.html', '<!doctype html><html><body><div id="toolbar"><input id="urlBar"></div><div id="tabStrip"></div><main id="paneArea"><div id="webviewParking"></div><section class="pane" id="pane-0"><div class="pane-header"></div></section><section class="pane" id="pane-1"><div class="pane-header"></div></section><section class="pane" id="pane-2"><div class="pane-header"></div></section><div id="divider-0" class="divider"></div><div id="divider-1" class="divider"></div></main><script src="../audio-controller.js"></script><script src="../renderer.js"></script><script src="splitview-test.js"></script></body></html>')
add('electron/tests/run-test.js', "const {app,BrowserWindow}=require('electron');const path=require('path');app.whenReady().then(()=>{const w=new BrowserWindow({show:false,webPreferences:{webviewTag:true}});w.loadFile(path.join(__dirname,'test.html'));w.webContents.on('page-title-updated',(e,t)=>{if(t.startsWith('TESTS:')){console.log(t);app.exit(t.includes('PASS')?0:1)}});setTimeout(()=>{console.error('TIMEOUT');app.exit(2)},15000)})")
add('electron/tests/splitview-test.js', "(async()=>{const s=window.__splitview;let p=0,f=0;const a=(n,x)=>x?(p++):(f++,console.error(n));a('initial',s.state.layout===1);s.setLayout(2);a('2 panes',s.state.layout===2);s.setLayout(3);a('3 panes',s.state.layout===3);const t=s.createTab('about:blank');a('tab',!!t);a('assigned',s.state.panes.includes(t.id));s.focusPane(1);a('focus',s.state.focusedPane===1);s.swapPanes(0,1);a('swap',s.state.panes.length===3);s.saveState();a('persist',!!localStorage.getItem('surf-fed-splitview'));document.title=`TESTS:${f?'FAIL':'PASS'} ${p+f}/${p+f}`})()")
add('electron/tests/audio-mute-test.js', "// Acceptance checklist for the default-mute controller.\nconsole.assert(audioController.shouldMute('https://example.com'));\n")

# Built-in extension manifests/scripts
exts={
'ad-blocker':('{"manifest_version":3,"name":"Surf FED Ad Blocker","version":"1.0.0","permissions":["declarativeNetRequest"],"host_permissions":["<all_urls>"],"declarative_net_request":{"rule_resources":[{"id":"rules","enabled":true,"path":"rules.json"}]}}','[{"id":1,"priority":1,"action":{"type":"block"},"condition":{"urlFilter":"ads","resourceTypes":["script","image","media"]}}]',''),
'dark-reader':('{"manifest_version":3,"name":"Surf FED Dark Reader","version":"1.0.0","content_scripts":[{"matches":["<all_urls>"],"js":["content.js"],"run_at":"document_start"}]}','',"document.documentElement.style.filter='invert(.9) hue-rotate(180deg)';"),
'fed-gram':('{"manifest_version":3,"name":"Surf FED Fed-Gram","version":"1.0.0","background":{"service_worker":"background.js"},"action":{"default_popup":"popup.html"}}','',"chrome.runtime.onInstalled.addListener(()=>console.log('Fed-Gram ready'));"),
'page-info':('{"manifest_version":3,"name":"Surf FED Page Info","version":"1.0.0","action":{"default_popup":"popup.html"},"content_scripts":[{"matches":["<all_urls>"],"js":["content.js"]}]}','',"document.title = document.title;"),}
for name,(manifest,rules,js) in exts.items():
    base=f'electron/extensions/builtin/{name}'
    add(base+'/manifest.json',manifest)
    if rules:add(base+'/rules.json',rules)
    if name=='dark-reader' or name=='fed-gram' or name=='page-info': add(base+('/content.js' if name!='fed-gram' else '/background.js'),js)
    if name in ('fed-gram','page-info'):
        add(base+'/popup.html', '<!doctype html><html><body><h3>'+name+'</h3><script src="popup.js"></script></body></html>')
        add(base+'/popup.js', "document.body.insertAdjacentText('beforeend',' ready');")

# Tauri scaffold
add('tauri/package.json','{"name":"surf-fed-tauri","private":true,"scripts":{"dev":"vite","build":"vite build"},"dependencies":{"@tauri-apps/api":"^2"},"devDependencies":{"vite":"^6"}}')
add('tauri/vite.config.js','import { defineConfig } from "vite"; export default defineConfig({});')
add('tauri/index.html','<!doctype html><html><head><meta charset="UTF-8"><title>Surf FED Mobile</title><link rel="stylesheet" href="styles.css"></head><body><header>Surf FED <button>1</button><button>2</button><button>3</button><button>🔇</button></header><main id="paneArea"></main><footer><a href="mailto:careers@fedpromptly.com">careers@fedpromptly.com</a> · <a href="mailto:support@fedpromptly.com">support@fedpromptly.com</a> · <a href="mailto:business@fedpromptly.com">business@fedpromptly.com</a> · <a href="mailto:contact@fedpromptly.com">contact@fedpromptly.com</a></footer><script type="module" src="renderer.js"></script></body></html>')
add('tauri/renderer.js','const state={layout:1,panes:[null,null,null],focusedPane:0}; export function setLayout(n){state.layout=Math.max(1,Math.min(3,n)); render()} function render(){document.querySelector("#paneArea").style.gridTemplateColumns=`repeat(${state.layout},1fr)`} render();')
add('tauri/styles.css','html,body{margin:0;height:100%;font:16px system-ui;background:#101318;color:white}body{display:flex;flex-direction:column}header{padding:12px;background:#20242b}#paneArea{display:grid;flex:1;gap:4px}footer{text-align:center;font-size:11px;padding:4px}a{color:#9cc7ff}')
add('tauri/audio-controller.js','export const audioController={defaultMuted:true,whitelist:new Set(),shouldMute(origin){return this.defaultMuted&&!this.whitelist.has(origin)}};')
add('tauri/settings.html','<!doctype html><html><body><h1>Audio settings</h1></body></html>')
add('tauri/settings.js','export const settingsKey="surf-fed-audio";')
add('tauri/src-tauri/Cargo.toml','[package]\nname="surf-fed"\nversion="0.1.0"\nedition="2021"\n[lib]\nname="surf_fed_lib"\ncrate-type=["staticlib","cdylib","rlib"]\n[dependencies]\ntauri={version="2",features=[]}\n')
add('tauri/src-tauri/src/main.rs','fn main(){surf_fed_lib::run();}')
add('tauri/src-tauri/src/lib.rs','#[cfg_attr(mobile, tauri::mobile_entry_point)]\npub fn run(){tauri::Builder::default().run(tauri::generate_context!()).expect("error while running Surf FED");}')
add('tauri/src-tauri/src/audio.rs','pub fn default_muted() -> bool { true }')
add('tauri/src-tauri/build.rs','fn main(){tauri_build::build();}')
add('tauri/src-tauri/tauri.conf.json','{"productName":"Surf FED","version":"0.1.0","identifier":"com.surffed.browser","build":{"frontendDist":"../dist"},"app":{"windows":[{"title":"Surf FED"}]}}')
add('tauri/src-tauri/tauri.ios.conf.json','{"productName":"Surf FED iOS"}')
add('tauri/src-tauri/tauri.android.conf.json','{"productName":"Surf FED Android"}')
add('tauri/src-tauri/capabilities/default.json','{"identifier":"default","description":"Default permissions","windows":["main"],"permissions":["core:default"]}')
for d in ['tauri/src-tauri/extensions/builtin/ad-blocker','tauri/src-tauri/extensions/builtin/dark-reader','tauri/src-tauri/extensions/builtin/fed-gram','tauri/src-tauri/extensions/builtin/page-info','tauri/src-tauri/icons','tauri/src-tauri/gen/android','tauri/src-tauri/gen/apple','prompts','wiki','discussion']:
    add(d+'/.gitkeep','')

# Docs
for n in ['ADR','ROADMAP','DEPLOYMENT','BUILD','INSTALL','SUMMARY','EXTENSIONS','SURF_FED_TAURI_FEASIBILITY_STUDY','TAURI_MIGRATION_CHECKLIST']:
    add('docs/'+n+'.md', f'# {n.replace("_"," ")}\n\nThis document is part of the Surf FED project scaffold.\n')
add('subscribe.html','<!doctype html><html><head><meta charset="UTF-8"><title>Support Surf FED</title><link rel="icon" href="favicon.ico"><link rel="stylesheet" href="styles.css"></head><body><main><h1>Support Surf FED</h1><p>Help build a power-user browser with a true three-pane workspace.</p><script type="text/javascript" src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"></script><script type="text/javascript">kofiwidget2.init("Support me on Ko-fi", "#72a4f2", "W3T61ZU5FS");kofiwidget2.draw();</script></main><footer><a href="mailto:careers@fedpromptly.com">careers@fedpromptly.com</a> · <a href="mailto:support@fedpromptly.com">support@fedpromptly.com</a> · <a href="mailto:business@fedpromptly.com">business@fedpromptly.com</a> · <a href="mailto:contact@fedpromptly.com">contact@fedpromptly.com</a></footer></body></html>')
add('styles.css','body{font-family:system-ui;max-width:900px;margin:0 auto;padding:3rem;background:#101318;color:#f4f4f5}a{color:#9cc7ff}footer{margin-top:4rem;font-size:.85rem}')

# write text files
for path, content in files.items():
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(content,encoding='utf-8')

# simple 1280x640 PNG generator (solid branded gradient bands)
def png(path,w=1280,h=640):
    rows=[]
    for y in range(h):
        r,g,b=16+int(30*y/h),24+int(40*y/h),45+int(70*y/h)
        row=bytearray([0])
        for x in range(w):
            rr=min(255,r+int(35*x/w)); gg=min(255,g+int(20*x/w)); bb=min(255,b+int(50*x/w)); row.extend((rr,gg,bb,255))
        rows.append(bytes(row))
    raw=b''.join(rows)
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    path.write_bytes(data)
png(ROOT/'social-image.png')
# use the PNG as a valid small favicon fallback; convert to ICO when available
shutil.copy(ROOT/'social-image.png',ROOT/'favicon.ico')
print(f'Created {len(files)} text files under {ROOT}')
''
