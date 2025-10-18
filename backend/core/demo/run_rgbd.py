import sys
import os
import cv2
import argparse
import numpy as np

BUILD_DIR = os.path.join(os.path.dirname(__file__), "../build")
sys.path.insert(0, BUILD_DIR)

import orbslam3

parser = argparse.ArgumentParser(
    description="Run ORB-SLAM3 on monocular video and extract 3-D map points")
parser.add_argument("--vocab_file", required=True,
                    help="Path to ORB-SLAM3 vocabulary file (*.txt)")
parser.add_argument("--settings_file", required=True,
                    help="Path to camera settings YAML file")
parser.add_argument("--video", required=True,
                    help="Path to input video file")
parser.add_argument("--show", action="store_true",
                    help="Show tracking video window")
args = parser.parse_args()

slam = orbslam3.system(args.vocab_file,
                       args.settings_file,
                       orbslam3.Sensor.MONOCULAR)
slam.set_use_viewer(False)
slam.initialize()

cap = cv2.VideoCapture(args.video)
if not cap.isOpened():
    raise RuntimeError(f"Cannot open video: {args.video}")

fps = cap.get(cv2.CAP_PROP_FPS)
dt = 1.0 / fps if fps > 0 else 0.033
frame_idx = 0


while True:
    ret, frame = cap.read()
    if not ret:
        break

    timestamp = frame_idx * dt
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    ok = slam.process_image_mono(gray, timestamp)

    if ok:
        print(f"[Frame {frame_idx:05d}] Tracking OK")

        if frame_idx > 20:
            trajectory = slam.get_trajectory()
            if trajectory:
                cam_pose = trajectory[-1]
                print(f"Camera Pose:\n{cam_pose}")

        if frame_idx > 20:
            tracked_points = slam.get_tracked_map_points()
            if tracked_points:
                points_array = np.array(tracked_points)
                print(f"  → {len(points_array)} tracked 3-D points")
                np.savetxt(f"frame_{frame_idx:05d}_points.txt",
                           points_array, fmt="%.6f")
    else:
        print(f"[Frame {frame_idx:05d}] Tracking LOST")

    if args.show:
        cv2.imshow("Mono SLAM", gray)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    frame_idx += 1


slam.shutdown()
cap.release()
cv2.destroyAllWindows()
print("[INFO] Finished processing video.")