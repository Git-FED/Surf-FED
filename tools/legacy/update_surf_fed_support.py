from pathlib import Path
import shutil

ROOT = Path('/home/ubuntu/surf-fed')

funding = '''# GitHub Sponsors / funding configuration
# Keep custom links as valid quoted URLs; GitHub supports up to four.
github: [FED-OS]
ko_fi: fedpromptly
patreon: fedpromptly
custom:
  - "https://fedpromptly.com"
  - "https://discord.gg"
  - "https://fedpromptly.com"
  - "https://github.com"
'''
(ROOT / '.github' / 'FUNDING.yml').write_text(funding, encoding='utf-8')

# The user requested these documentation/template names at repository root as well as .github copies.
root_copies = {
    'ADR.md': ROOT / 'docs' / 'ADR.md',
    'ROADMAP.md': ROOT / 'docs' / 'ROADMAP.md',
    'DEPLOYMENT.md': ROOT / 'docs' / 'DEPLOYMENT.md',
    'BUILD.md': ROOT / 'docs' / 'BUILD.md',
    'INSTALL.md': ROOT / 'docs' / 'INSTALL.md',
    'SUMMARY.md': ROOT / 'docs' / 'SUMMARY.md',
    'PULL_REQUEST_TEMPLATE.md': ROOT / '.github' / 'PULL_REQUEST_TEMPLATE.md',
    'bug_report.md': ROOT / '.github' / 'ISSUE_TEMPLATE' / 'bug_report.md',
    'feature_request.md': ROOT / '.github' / 'ISSUE_TEMPLATE' / 'feature_request.md',
}
for destination, source in root_copies.items():
    shutil.copyfile(source, ROOT / destination)

support_markup = '''
<section class="support-links" aria-label="Support Surf FED">
  <h2>Support Surf FED</h2>
  <p>
    <a href="https://ko-fi.com/fedpromptly" target="_blank" rel="noopener">
      <img height="36" style="border:0;height:36px" src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support Surf FED on Ko-fi" />
    </a>
  </p>
  <p>
    <a href="https://www.buymeacoffee.com/fedpromptly" target="_blank" rel="noopener">
      <img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20book&emoji=%F0%9F%93%96&slug=fedpromptly&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a book" />
    </a>
  </p>
</section>
'''
footer = '''
<footer class="footer">
  <a href="mailto:careers@fedpromptly.com">careers@fedpromptly.com</a> ·
  <a href="mailto:support@fedpromptly.com">support@fedpromptly.com</a> ·
  <a href="mailto:business@fedpromptly.com">business@fedpromptly.com</a> ·
  <a href="mailto:contact@fedpromptly.com">contact@fedpromptly.com</a>
</footer>
'''

for html_path in sorted(ROOT.rglob('*.html')):
    text = html_path.read_text(encoding='utf-8')
    # Remove only previously inserted blocks, keeping the source idempotent.
    start = text.find('<section class="support-links"')
    if start >= 0:
        end = text.find('</section>', start)
        if end >= 0:
            text = text[:start] + text[end + len('</section>'):]
    footer_start = text.find('<footer class="footer">')
    if footer_start >= 0:
        footer_end = text.find('</footer>', footer_start)
        if footer_end >= 0:
            text = text[:footer_start] + text[footer_end + len('</footer>'):]
    insertion = support_markup + footer
    if '</body>' in text:
        text = text.replace('</body>', insertion + '</body>', 1)
    else:
        text += insertion
    html_path.write_text(text, encoding='utf-8')

# Add a stable support section to README without duplicating it on reruns.
readme = ROOT / 'README.md'
readme_text = readme.read_text(encoding='utf-8')
if '## Funding and support' not in readme_text:
    readme_text += '''\n## Funding and support\n\nSurf FED is supported through [GitHub Sponsors](https://github.com/sponsors/FED-OS), [Ko-fi](https://ko-fi.com/fedpromptly), [Patreon](https://patreon.com/fedpromptly), and [Buy Me a Coffee](https://www.buymeacoffee.com/fedpromptly).\n\nVisit [fedpromptly.com](https://fedpromptly.com) or join the [Discord community](https://discord.gg) to follow the project.\n'''
readme.write_text(readme_text, encoding='utf-8')
print(f'Updated {len(list(ROOT.rglob("*.html")))} HTML files and GitHub funding configuration.')
