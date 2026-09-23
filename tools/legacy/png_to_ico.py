from pathlib import Path
import struct
src = Path('/home/ubuntu/surf-fed/social-image.png').read_bytes()
# ICO containing a PNG image is supported by modern browsers and GitHub Pages.
width = height = 0  # 0 means 256px or larger in ICO metadata; embedded PNG retains source dimensions.
header = struct.pack('<HHH', 0, 1, 1)
entry = struct.pack('<BBBBHHII', width, height, 0, 0, 1, 32, len(src), 22)
Path('/home/ubuntu/surf-fed/favicon.ico').write_bytes(header + entry + src)
print('wrote ICO container:', len(src), 'embedded PNG bytes')
