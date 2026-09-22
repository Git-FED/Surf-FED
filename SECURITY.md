# Security

The browser chrome runs with context isolation, no Node integration, and a restrictive content security policy. Do not add remote scripts to `electron/index.html`.

Unpacked extensions are arbitrary code by design and should only be loaded from trusted directories. Extension load failures must be shown to the user; never enable `allowUncheckedErrors` to conceal them. Report vulnerabilities privately to support@fedpromptly.com.
