# Frequently asked questions

## Does the split view really have three panes?

Yes. The Electron renderer supports 1-, 2-, and 3-pane modes, and the smoke suite checks the 3-pane round trip and webview identity.

## Can mobile load Chrome extensions?

No. iOS and Android use WebKit. Mobile built-ins must be native or renderer features; arbitrary unpacked Chrome extensions are desktop-only.

## Why is the Electron test not a browser screenshot test?

The important contract is the state machine: pane assignment, parking, focus, persistence, and object identity. The smoke suite tests those directly in Electron.
