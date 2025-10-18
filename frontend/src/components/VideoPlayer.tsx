import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CanvasVideoPlayer, { type VideoPoint } from '@/components/CanvasVideoPlayer';

interface VideoPlayerProps {
  processingId: string;
  currentFrame?: number;
  totalFrames?: number;
  onFrameChange?: (frame: number) => void;
  keypoints_2d?: Array<{ x: number; y: number }>; // legacy array of points for current frame
  points?: VideoPoint[]; // new unified points with frame/time metadata
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  processingId,
  currentFrame = 0,
  totalFrames = 1,
  onFrameChange,
  keypoints_2d = [],
  points = []
}) => {
  // Local controlled frame/time (CanvasVideoPlayer will notify via callback)
  // internal frame mirror (could be exposed later if needed)
  const [internalFrame, setInternalFrame] = React.useState(currentFrame);
  const playerRef = React.useRef<any>(null);

  const handleFrameChange = React.useCallback((frame: number) => {
    if (frame !== internalFrame) setInternalFrame(frame);
    onFrameChange?.(frame);
  }, [onFrameChange, internalFrame]);

  // Removed native controls and external seek; CanvasVideoPlayer handles playback.

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Видео с отслеживаемыми точками</span>
          <div className="text-sm text-muted-foreground">
            Кадр: {currentFrame} / {totalFrames}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <CanvasVideoPlayer
            ref={playerRef}
            processingId={processingId}
            keypoints_2d={keypoints_2d}
            points={points}
            totalFrames={totalFrames}
            externalCurrentFrame={currentFrame}
            onFrameChange={handleFrameChange}
            hideControls={true}
            autoPlay
            canvasStyle={{ width: '100%', maxHeight: '600px', borderRadius: '8px', border: '2px solid #93c5fd' }}
          />
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          {keypoints_2d && keypoints_2d.length > 0 ? (
            <span className="text-green-600 font-bold">✓ Отображается {keypoints_2d.length} ключевых точек</span>
          ) : (
            <span className="text-red-600">✗ Нет ключевых точек для отображения</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
