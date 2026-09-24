const nav = document.querySelector('.main-nav');
const toggle = document.querySelector('.menu-toggle');
if (toggle && nav) toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.classList.remove('open'); toggle?.setAttribute('aria-expanded','false'); }));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((element, index) => { element.style.transitionDelay = `${Math.min(index * 35, 240)}ms`; observer.observe(element); });
const modes = {
  workspace: { title: 'Three panes. One clear line of thought.', body: 'Research on the left. Your working document in the middle. Reference or communication on the right. Drag the dividers, park a tab, and come back exactly where you left off.', image: 'assets/screenshots/three-pane-workspace.png', label: 'THREE-PANE MODE' },
  focus: { title: 'Make quiet the default.', body: 'New tabs start muted unless you say otherwise. Your whitelist persists, so the sites you trust stay useful without turning every page into a broadcast.', image: 'assets/screenshots/mute-by-default.png', label: 'GLOBAL MUTE CONTROL' },
  extensions: { title: 'Keep your tools close.', body: 'Desktop extension support and built-in capabilities belong in the workspace, not in a maze of separate windows and half-remembered settings.', image: 'assets/screenshots/extension-panel.png', label: 'EXTENSION PANEL' }
};
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-mode]').forEach(item => item.classList.remove('active')); button.classList.add('active'); const mode = modes[button.dataset.mode]; document.querySelector('#showcase-title').textContent = mode.title; document.querySelector('#showcase-body').textContent = mode.body; document.querySelector('#showcase-image').src = mode.image; document.querySelector('#showcase-label').textContent = mode.label; }));
