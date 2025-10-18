import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Point2D {
  x: number;
  y: number;
}

interface CanvasVideoTrackerProps {
  videoUrl: string;
  currentFrame: number;
  points2D: Point2D[];
  width?: number;
  height?: number;
  pointColor?: string;
  pointRadius?: number;
}

export const CanvasVideoTracker: React.FC<CanvasVideoTrackerProps> = ({
  videoUrl,
  currentFrame,
  points2D,
  width = 1920,
  height = 1080,
  pointColor = '#00ff00',
  pointRadius = 4,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [fps, setFps] = useState(30); // Default FPS
  const lastDrawnFrameRef = useRef<number>(-1);

  // Draw current frame and points with scaling
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !video || !ctx || !isVideoLoaded || video.readyState < 2) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate scaling factors (in case canvas display size differs from video resolution)
    const scaleX = canvas.width / (video.videoWidth || width);
    const scaleY = canvas.height / (video.videoHeight || height);

    // Draw 2D points with proper scaling
    if (points2D && points2D.length > 0) {
      ctx.fillStyle = pointColor;
      ctx.strokeStyle = pointColor;
      ctx.lineWidth = 2;

      points2D.forEach((point) => {
        // Scale points to canvas size (points are in original video resolution)
        const scaledX = point.x * scaleX;
        const scaledY = point.y * scaleY;

        // Draw filled circle for each point
        ctx.beginPath();
        ctx.arc(scaledX, scaledY, pointRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw a small cross for better visibility
        const crossSize = pointRadius + 3;
        ctx.beginPath();
        ctx.moveTo(scaledX - crossSize, scaledY);
        ctx.lineTo(scaledX + crossSize, scaledY);
        ctx.moveTo(scaledX, scaledY - crossSize);
        ctx.lineTo(scaledX, scaledY + crossSize);
        ctx.stroke();
      });
    }
  }, [isVideoLoaded, points2D, pointColor, pointRadius, width, height]);

  // Load and setup video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      setIsVideoLoaded(true);
      setFps(30); // Default to 30fps
    };

    const handleLoadedData = () => {
      console.log('Video data loaded, ready to play');
      drawFrame();
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      drawFrame();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl, drawFrame]);

  // Update video frame when currentFrame changes (optimized)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoLoaded) return;

    // Skip if we're already on this frame
    if (lastDrawnFrameRef.current === currentFrame) {
      return;
    }

    // Calculate time from frame number
    const timeInSeconds = currentFrame / fps;
    
    // Only seek if the difference is significant (> 0.01 seconds)
    const timeDiff = Math.abs(video.currentTime - timeInSeconds);
    if (timeDiff < 0.01) {
      drawFrame();
      lastDrawnFrameRef.current = currentFrame;
      return;
    }
    
    // Set video to specific frame
    video.currentTime = timeInSeconds;

    const handleSeeked = () => {
      drawFrame();
      lastDrawnFrameRef.current = currentFrame;
    };

    video.addEventListener('seeked', handleSeeked, { once: true });

    return () => {
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [currentFrame, isVideoLoaded, fps, drawFrame]);

  // Redraw when points change
  useEffect(() => {
    if (isVideoLoaded) {
      drawFrame();
    }
  }, [points2D, drawFrame, isVideoLoaded]);

  return (
    <div className="relative inline-block w-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border shadow-md w-full"
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
      />
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        muted
      />
    </div>
  );
};

export default CanvasVideoTracker;
