"""Rebuild the local film catalogue and real video posters: python scripts/build_catalog.py."""
from pathlib import Path
import concurrent.futures, hashlib, json, re, subprocess
import imageio_ffmpeg
ROOT = Path(__file__).resolve().parents[1]
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
POSTERS = ROOT / 'assets' / 'posters'
POSTERS.mkdir(parents=True, exist_ok=True)
def build(path):
    relative = path.relative_to(ROOT).as_posix()
    key = hashlib.sha1(relative.encode()).hexdigest()[:12]
    poster = POSTERS / (key + '.jpg')
    info = subprocess.run([FFMPEG, '-hide_banner', '-i', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    match = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', info)
    seconds = sum(float(v)*m for v,m in zip(match.groups(), [3600,60,1])) if match else 0
    if not poster.exists():
        subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-ss', str(min(2.0, seconds*.18)), '-i', str(path), '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '4', '-y', str(poster)], check=True, capture_output=True)
    parts = path.relative_to(ROOT / 'videos').parts
    group = parts[0]
    subject = parts[1] if group == 'AI PRODUCTION' else group
    raw = path.stem
    title = re.sub(r'^\d+[.\-]\s*', '', raw).replace('_1','').rstrip('- ')
    if raw.startswith('Video_'):
        title = f'{subject} — Study {raw.split("_")[-1]}'
    else:
        title = title.replace('-', ' ')
    return dict(id=key, src=relative, poster=f'assets/posters/{key}.jpg', title=title, filename=path.name, group=group, subject=subject, duration=f'{int(seconds)//60:02}:{int(seconds)%60:02}')
if __name__ == '__main__':
    paths = sorted((ROOT / 'videos').rglob('*.mp4'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        films = list(pool.map(build, paths))
    (ROOT / 'assets' / 'catalog.js').write_text('window.FILMS = ' + json.dumps(films, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print(f'Built {len(films)} films and posters.')
