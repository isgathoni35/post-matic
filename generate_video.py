#!/usr/bin/env python3
"""CLI Entrypoint for the Faceless Video Engine."""
import argparse
from pathlib import Path
import sys

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from engine.pipeline import generate_faceless_video
from engine.tts_engine import AVAILABLE_VOICES, DEFAULT_VOICE


def main():
    parser = argparse.ArgumentParser(
        description="PostMatic: Automated Faceless Vertical Video Generator CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--topic",
        "-t",
        type=str,
        required=True,
        help="The topic or prompt for the video (e.g. '3 bizarre facts about deep sea')",
    )
    parser.add_argument(
        "--duration",
        "-d",
        type=int,
        default=25,
        help="Target video duration in seconds",
    )
    parser.add_argument(
        "--voice",
        "-v",
        type=str,
        default=DEFAULT_VOICE,
        help=f"Voice to use. Options include: {', '.join(AVAILABLE_VOICES.keys())} or full neural voice name",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Custom output file path for the generated .mp4",
    )

    args = parser.parse_args()

    # Map voice alias if passed (e.g. 'guy' -> 'en-US-GuyNeural')
    selected_voice = AVAILABLE_VOICES.get(args.voice.lower(), args.voice)
    output_path = Path(args.output) if args.output else None

    try:
        result = generate_faceless_video(
            topic=args.topic,
            target_duration=args.duration,
            voice=selected_voice,
            output_path=output_path,
        )
        print(f"Generated video ready at: {result.video_path}")
    except Exception as e:
        print(f"\n[ERROR] Generation failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
