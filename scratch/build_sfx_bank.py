"""Script to synthesize high-quality procedural SFX library using FFmpeg audio synthesis."""
import subprocess
from pathlib import Path
import shutil
import imageio_ffmpeg

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SFX_DIR = PROJECT_ROOT / "assets" / "audio" / "sfx"
SFX_DIR.mkdir(parents=True, exist_ok=True)

ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

def generate_sfx(filename: str, filter_graph: str, duration: float):
    dest = SFX_DIR / filename
    cmd = [
        ffmpeg_bin,
        "-y",
        "-f", "lavfi",
        "-i", filter_graph,
        "-t", str(duration),
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        str(dest)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"Generated {filename} ({dest.stat().st_size} bytes)")

def main():
    print(f"Generating SFX bank into {SFX_DIR}...")

    # 1. Punch Heavy: Low rumble + mid punch snap + rapid decay
    generate_sfx(
        "punch_heavy.mp3",
        "anoisesrc=d=0.35:c=brown:r=44100,lowpass=f=220,volume=3.5,afade=t=out:ss=0.08:d=0.25",
        0.35
    )

    # 2. Punch Light / Slap: Fast transient white noise snap
    generate_sfx(
        "punch_light.mp3",
        "anoisesrc=d=0.2:c=white:r=44100,bandpass=f=1200:w=800,volume=2.8,afade=t=out:ss=0.03:d=0.15",
        0.2
    )

    # 3. Sword Clash: Dual metallic ring with slight echo
    generate_sfx(
        "sword_clash.mp3",
        "aevalsrc='0.5*sin(2*PI*2400*t)*exp(-12*t) + 0.4*sin(2*PI*3600*t)*exp(-15*t) + 0.3*sin(2*PI*5200*t)*exp(-20*t)':s=44100,aecho=0.8:0.7:20|40:0.4|0.2",
        0.8
    )

    # 4. Flight Whoosh / Superman Flight: Fast frequency sweep wind gust
    generate_sfx(
        "flight_whoosh.mp3",
        "anoisesrc=d=0.8:c=pink:r=44100,bandpass=f=800:w=600,flanger=delay=8:depth=5:speed=2,afade=t=in:ss=0:d=0.2,afade=t=out:ss=0.3:d=0.5,volume=3.0",
        0.8
    )

    # 5. Superman Takeoff: Low frequency roar rising up into a sonic whoosh
    generate_sfx(
        "superman_takeoff.mp3",
        "anoisesrc=d=1.2:c=brown:r=44100,lowpass=f=400,volume=3.8,afade=t=in:ss=0:d=0.4,afade=t=out:ss=0.5:d=0.7",
        1.2
    )

    # 6. Sonic Boom: Instant explosive crack + sub-bass decay
    generate_sfx(
        "sonic_boom.mp3",
        "anoisesrc=d=1.4:c=brown:r=44100,lowpass=f=160,volume=4.5,afade=t=out:ss=0.1:d=1.2",
        1.4
    )

    # 7. Glass Clink: Clean high-frequency crystalline resonance (e.g. glass on table)
    generate_sfx(
        "glass_clink.mp3",
        "aevalsrc='0.6*sin(2*PI*2093*t)*exp(-8*t) + 0.4*sin(2*PI*3136*t)*exp(-10*t)':s=44100,aecho=0.8:0.8:30:0.3",
        0.7
    )

    # 8. Door Slam: Heavy wooden thud
    generate_sfx(
        "door_slam.mp3",
        "anoisesrc=d=0.5:c=brown:r=44100,lowpass=f=180,volume=3.5,afade=t=out:ss=0.05:d=0.4",
        0.5
    )

    # 9. Teleport Zap: Sci-fi frequency modulation
    generate_sfx(
        "teleport_zap.mp3",
        "aevalsrc='0.5*sin(2*PI*(800 + 1200*t)*t)*exp(-4*t)':s=44100,flanger=speed=8:depth=10",
        0.6
    )

    # 10. Record Scratch: DJ humor needle scratch
    generate_sfx(
        "record_scratch.mp3",
        "anoisesrc=d=0.4:c=white:r=44100,bandpass=f=2800:w=1200,volume=2.5,afade=t=in:ss=0:d=0.05,afade=t=out:ss=0.1:d=0.25",
        0.4
    )

    # 11. Cinematic Explosion: Massive bass rumble and debris
    generate_sfx(
        "explosion_cinematic.mp3",
        "anoisesrc=d=2.0:c=brown:r=44100,lowpass=f=140,volume=4.0,afade=t=out:ss=0.2:d=1.7",
        2.0
    )

    # 12. Anime Powerup: Rising cosmic harmonic tone
    generate_sfx(
        "anime_powerup.mp3",
        "aevalsrc='0.4*sin(2*PI*(220 + 350*t)*t) + 0.3*sin(2*PI*(440 + 700*t)*t)':s=44100,afade=t=in:ss=0:d=0.3,afade=t=out:ss=0.9:d=0.6,flanger=speed=4",
        1.5
    )

    print("All 12 SFX assets generated successfully!")

if __name__ == "__main__":
    main()
