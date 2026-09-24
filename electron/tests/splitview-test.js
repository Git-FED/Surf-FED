(async () => {
  const split = window.__splitview;
  const failures = [];
  let passed = 0;
  let total = 0;

  function assert(name, condition) {
    total += 1;
    if (condition) passed += 1;
    else failures.push(name);
  }

  // Start from an empty, deterministic state.
  for (const tab of split.state.tabs.values()) tab.webview.remove();
  split.state.tabs.clear();
  split.state.panes = [null, null, null];
  split.state.layout = 1;
  split.state.focusedPane = 0;
  split.state.nextTabId = 1;
  localStorage.removeItem('surf-fed-splitview-v3');

  // Layout: 6 assertions.
  split.setLayout(1); assert('initial layout is one pane', split.state.layout === 1);
  split.setLayout(2); assert('setLayout(2)', split.state.layout === 2);
  split.setLayout(3); assert('setLayout(3)', split.state.layout === 3);
  assert('three pane elements visible', document.querySelectorAll('.pane.visible').length === 3);
  split.setLayout(1); assert('setLayout(1)', split.state.layout === 1);
  assert('hidden pane slots remain present', split.state.panes.length === 3);

  // Tabs and parking: 5 assertions.
  const first = split.createTab('about:blank');
  assert('createTab returns an ID', typeof first.id === 'number');
  assert('new tab fills focused pane', split.state.panes[0] === first.id);
  const firstWebview = first.webview;
  const second = split.createTab('about:blank');
  assert('displaced tab is parked', split.isParked(first.id));
  assert('parked webview remains connected', first.webview === firstWebview && first.webview.isConnected);

  // Focus and toolbar ownership: 4 assertions.
  split.setLayout(2);
  split.focusPane(1);
  assert('focusPane selects pane one', split.state.focusedPane === 1);
  split.focusPane(99);
  assert('focusPane ignores hidden pane', split.state.focusedPane === 1);
  assert('two pane elements are visible', document.querySelectorAll('.pane.visible').length === 2);
  split.focusPane(0);
  assert('focused pane has a tab', Boolean(split.state.panes[0]));
  assert('URL bar follows focused tab', document.getElementById('urlBar').value === split.state.tabs.get(split.state.panes[0]).url);

  // Swap without recreation: 4 assertions.
  split.setLayout(3);
  const third = split.createTab('about:blank');
  split.focusPane(0);
  const paneZero = split.state.panes[0];
  const paneOne = split.state.panes[1];
  const paneZeroWebview = split.state.tabs.get(paneZero).webview;
  const paneOneWebview = split.state.tabs.get(paneOne).webview;
  split.swapPanes(0, 1);
  assert('swap exchanges pane IDs', split.state.panes[0] === paneOne && split.state.panes[1] === paneZero);
  assert('first webview identity preserved', split.state.tabs.get(paneZero).webview === paneZeroWebview);
  assert('second webview identity preserved', split.state.tabs.get(paneOne).webview === paneOneWebview);
  assert('third tab remains open', split.state.tabs.has(third.id));

  // Closing/refill: 4 assertions.
  const closeId = split.state.panes[0];
  const beforeClose = split.state.tabs.size;
  split.closeTab(closeId);
  assert('close removes tab from map', !split.state.tabs.has(closeId));
  assert('close removes exactly one tab', split.state.tabs.size === beforeClose - 1);
  assert('closed pane refills', Boolean(split.state.panes[0]));
  for (const tab of [...split.state.tabs.values()]) split.closeTab(tab.id);
  assert('closing all tabs creates a replacement', split.state.tabs.size === 1);

  // Persistence and 3→1→3: 4 assertions.
  split.setLayout(3);
  const assignment = [...split.state.panes];
  const identities = assignment.map((id) => split.state.tabs.get(id)?.webview);
  split.saveState();
  assert('saveState writes localStorage', Boolean(localStorage.getItem('surf-fed-splitview-v3')));
  split.setLayout(1);
  split.setLayout(3);
  assert('3→1→3 restores pane assignment', JSON.stringify(split.state.panes) === JSON.stringify(assignment));
  assert('3→1→3 preserves first webview', !assignment[0] || split.state.tabs.get(assignment[0]).webview === identities[0]);
  assert('3→1→3 preserves all live webviews', assignment.every((id, index) => !id || split.state.tabs.get(id).webview === identities[index]));

  const summary = failures.length === 0 ? `TESTS:PASS ${passed}/${total}` : `TESTS:FAIL ${passed}/${total} :: ${failures.join(' | ')}`;
  window.__splitTestResult = { summary, failures, passed, total };
  document.title = summary;
  console.log(summary);
})();
