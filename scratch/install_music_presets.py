"""Downloads and installs authentic royalty-free studio audio tracks into assets/audio and web/public/audio/music."""
import json
import shutil
import subprocess
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets" / "audio"
WEB_DIR = PROJECT_ROOT / "web" / "public" / "audio" / "music"

ASSETS_DIR.mkdir(parents=True, exist_ok=True)
WEB_DIR.mkdir(parents=True, exist_ok=True)

TRACKS = {
    "cinematic_mystery": "https://upload.wikimedia.org/wikipedia/commons/4/45/Kevin_MacLeod_-_The_Endless.ogg",
    "epic_orchestral": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ride_of_the_Valkyries.ogg",
    "lofi_chill": "https://upload.wikimedia.org/wikipedia/commons/2/20/Gymnopedie_No._2_%28ISRC_USUAN1100786%29.mp3",
    "phonk_tension": "https://upload.wikimedia.org/wikipedia/commons/5/58/Kevin_MacLeod_-_Carefree.ogg",
    "uplifting_emotional": "https://upload.wikimedia.org/wikipedia/commons/2/23/Kevin_MacLeod_-_Windswept.ogg",
}

def get_ffmpeg_bin():
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"

def download_file(url: str, dest: Path, headers: dict):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        total = int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        with open(dest, "wb") as f:
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
    return downloaded

def main():
    ffmpeg = get_ffmpeg_bin()
    print(f"Using FFmpeg: {ffmpeg}")
    headers = {"User-Agent": "PostMatic-Installer/1.0 (contact@postmatic.app)"}
    
    results = {}
    for preset_id, url in TRACKS.items():
        final_mp3 = ASSETS_DIR / f"{preset_id}.mp3"
        web_mp3 = WEB_DIR / f"{preset_id}.mp3"

        # If already installed and > 1.5MB, just ensure copied to web
        if final_mp3.exists() and final_mp3.stat().st_size > 1_500_000:
            shutil.copyfile(final_mp3, web_mp3)
            size = final_mp3.stat().st_size
            results[preset_id] = f"ALREADY_INSTALLED: {size} bytes ({size / (1024*1024):.2f} MB)"
            print(f"Preset '{preset_id}' already installed ({results[preset_id]})")
            continue

        print(f"\nDownloading '{preset_id}' from {url}...")
        temp_ext = ".mp3" if ".mp3" in url else ".ogg"
        temp_in = ASSETS_DIR / f"{preset_id}_raw{temp_ext}"

        try:
            bytes_dl = download_file(url, temp_in, headers)
            print(f"  Downloaded {bytes_dl} bytes to {temp_in.name}")

            if temp_ext == ".mp3":
                shutil.copyfile(temp_in, final_mp3)
            else:
                cmd = [
                    ffmpeg, "-y",
                    "-i", str(temp_in),
                    "-c:a", "libmp3lame",
                    "-b:a", "192k",
                    str(final_mp3)
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            temp_in.unlink(missing_ok=True)
            shutil.copyfile(final_mp3, web_mp3)

            size = final_mp3.stat().st_size
            results[preset_id] = f"SUCCESS: {size} bytes ({size / (1024*1024):.2f} MB)"
            print(f"  -> Successfully installed {preset_id}.mp3 ({results[preset_id]})")
        except Exception as e:
            results[preset_id] = f"ERROR: {e}"
            print(f"  -> Failed {preset_id}: {e}")

    # Synchronize cinematic_ambient with cinematic_mystery
    if (ASSETS_DIR / "cinematic_mystery.mp3").exists():
        shutil.copyfile(ASSETS_DIR / "cinematic_mystery.mp3", ASSETS_DIR / "cinematic_ambient.mp3")
        shutil.copyfile(ASSETS_DIR / "cinematic_mystery.mp3", WEB_DIR / "cinematic_ambient.mp3")
        print("\nSynced cinematic_ambient.mp3 to cinematic_mystery.mp3")

    print("\nFinal Status:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
