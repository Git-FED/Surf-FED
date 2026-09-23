from pathlib import Path
import struct

root = Path('/home/ubuntu/surf-fed')
funding = (root / '.github/FUNDING.yml').read_text(encoding='utf-8')
assert 'github: [FED-OS]' in funding
assert 'ko_fi: fedpromptly' in funding
assert 'patreon: fedpromptly' in funding
assert funding.count('  - "https://') == 4
for url in ['https://fedpromptly.com', 'https://discord.gg', 'https://github.com']:
    assert url in funding

html_files = sorted(root.rglob('*.html'))
assert html_files
for path in html_files:
    text = path.read_text(encoding='utf-8')
    assert 'buymeacoffee.com/fedpromptly' in text, path
    assert 'https://ko-fi.com/fedpromptly' in text, path
    for email in ['careers@fedpromptly.com', 'support@fedpromptly.com', 'business@fedpromptly.com', 'contact@fedpromptly.com']:
        assert email in text, (path, email)

png = (root / 'social-image.png').read_bytes()
assert png[:8] == b'\x89PNG\r\n\x1a\n'
width, height = struct.unpack('>II', png[16:24])
assert (width, height) == (1280, 640), (width, height)

required = [
    '.github/FUNDING.yml', '.github/workflows/build.yml',
    'README.md', 'social-image.png', 'favicon.ico', 'subscribe.html',
    'promo-cyber-grid.png', 'promo-desert-arch.png', 'promo-alpine-glass.png',
    'promo-editorial-collage.png', 'promo-ocean-orbit.png',
    'ADR.md', 'ROADMAP.md', 'DEPLOYMENT.md', 'BUILD.md', 'INSTALL.md', 'SUMMARY.md',
    'PULL_REQUEST_TEMPLATE.md', 'bug_report.md', 'feature_request.md',
]
for item in required:
    assert (root / item).exists(), item
print(f'funding_ok html_files={len(html_files)} social_image={width}x{height} required_tree_entries=ok')
