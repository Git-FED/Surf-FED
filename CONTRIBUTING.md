# Contributing

Read `NON_NEGOTIABLES.md` before changing browser behavior. Keep pane IDs and tab IDs separate, never recreate webviews during layout changes, and add a regression assertion for state-machine changes.

Before opening a pull request, run `node --check` on changed JavaScript and `cd electron && npm test`. Changes to extensions must include a valid MV3 manifest and must fail visibly if loading fails.
