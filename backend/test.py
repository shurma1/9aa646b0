from orb_slam.orb_slam import OrbslamMonoRunner

runner = OrbslamMonoRunner("EuRoC.yaml")
runner.open_video("video.mp4")

while True:
    ret, info = runner.process_frame()
    if not ret:
        break
    if info:
        print(info["pose"], info["points"].shape)

runner.stop()