#!/usr/bin/env python3
"""
Минимальный рабочий класс-обёртка ORB-SLAM3 monocular.
1:1 по логике твоего скрипта, но внутри класса.
"""
from __future__ import annotations

import os
import sys
import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional, Dict, Any

_HERE = Path(__file__).resolve().parent
BIN_DIR = _HERE / "bin"  # orb_slam/bin
VOCAB_DIR = _HERE / "vocab"  # orb_slam/bin

sys.path.insert(0, str(BIN_DIR))
import orbslam3  # noqa: E402


class OrbslamMonoRunner:
    """
    Повторяет твой исходный скрипт:
    - инициализация сразу в конструкторе
    - process_frame() → (ret, info) без txt-сохранений
    - stop() — shutdown + release
    """

    def __init__(
        self,
        settings_file: str | os.PathLike,
        min_init_frames: int = 20,
    ) -> None:
        self.vocab = Path(VOCAB_DIR / 'ORBvoc.txt')
        self.settings = Path(settings_file)
        self.min_init = min_init_frames

        # ---- инициализируем СРАЗУ (как в твоём скрипте) ----
        self.slam = orbslam3.system(
            str(self.vocab),
            str(self.settings),
            orbslam3.Sensor.MONOCULAR,
        )
        self.slam.set_use_viewer(False)
        self.slam.initialize()

        # ---- видео-поток ----
        self.cap: Optional[cv2.VideoCapture] = None
        self.dt: float = 0.033
        self.frame_idx: int = 0

    # ---------- public ----------
    def open_video(self, video_source: str | os.PathLike | int) -> None:
        """Открыть видео (как ты делал в скрипте)."""
        self.cap = cv2.VideoCapture(video_source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_source}")
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.dt = 1.0 / fps if fps > 0 else 0.033
        self.frame_idx = 0

    def process_frame(self) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Один кадр = 1 вызов (логика твоего while True)."""
        if not self.cap:
            raise RuntimeError("Video not opened. Call open_video() first.")

        ret, frame = self.cap.read()
        if not ret:
            return False, None

        timestamp = self.frame_idx * self.dt
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        ok = self.slam.process_image_mono(gray, timestamp)
        self.frame_idx += 1

        info: Optional[Dict[str, Any]] = None
        if ok and self.frame_idx > self.min_init:
            trajectory = self.slam.get_trajectory()
            points = self.slam.get_tracked_map_points()
            info = {
                "frame": self.frame_idx - 1,
                "pose": trajectory[-1] if trajectory else None,
                "trajectory": trajectory,
                "points": np.array(points) if points else None,
            }
        return True, info

    def stop(self) -> None:
        """Shutdown + release (как в конце твоего скрипта)."""
        if self.slam:
            self.slam.shutdown()
        if self.cap:
            self.cap.release()


# ---------------- CLI (опционально) ----------------
def _main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="ORB-SLAM3 monocular (класс, 1:1)")
    parser.add_argument("--vocab_file", required=True)
    parser.add_argument("--settings_file", required=True)
    parser.add_argument("--video", required=True)
    parser.add_argument("--show", action="store_true")
    args = parser.parse_args()

    runner = OrbslamMonoRunner(args.vocab_file, args.settings_file)
    runner.open_video(args.video)

    try:
        while True:
            ret, info = runner.process_frame()
            if not ret:
                break
            if info:
                print(f"[Frame {info['frame']:05d}] Tracking OK")
                print(f"Camera Pose:\n{info['pose']}")
                if info["points"] is not None:
                    print(f"  → {len(info['points'])} tracked 3-D points")
            else:
                print(f"[Frame {runner.frame_idx:05d}] Tracking LOST")

            if args.show:
                cv2.imshow("Mono SLAM", np.zeros((480, 640), np.uint8))
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        runner.stop()
        cv2.destroyAllWindows()
        print("[INFO] Finished processing video.")


if __name__ == "__main__":
    _main()