import React from 'react';
import OrbSlam3DVisualization from './OrbSlam3DVisualization';
import CanvasVideoTracker from './CanvasVideoTracker';

interface CombinedVisualizationProps {
  // 3D Visualization props
  trajectory?: Array<{
    frame: number;
    pose: number[][];
  }>;
  currentPose?: number[][];
  trackedPoints?: Array<{ x: number; y: number; z: number }>;
  allMapPoints?: Array<{ x: number; y: number; z: number }>;
  showGrid?: boolean;
  
  // Video tracker props
  videoUrl: string;
  currentFrame: number;
  points2D?: Array<{ x: number; y: number }>;
  videoWidth?: number;
  videoHeight?: number;
  
  // Layout props
  threeDHeight?: string;
  canvasHeight?: string;
}

const CombinedVisualization: React.FC<CombinedVisualizationProps> = ({
  trajectory = [],
  currentPose,
  trackedPoints = [],
  allMapPoints = [],
  showGrid = true,
  videoUrl,
  currentFrame,
  points2D = [],
  videoWidth = 1920,
  videoHeight = 1080,
  threeDHeight = '400px',
  canvasHeight = '400px',
}) => {
  return (
    <div className="w-[100%] mx-auto overflow-hidden rounded-xl border border-border bg-card">
      {/* 3D Visualization - Top */}
      <div className="w-full border-b border-border">
        <div className="w-full" style={{ height: threeDHeight }}>
          <OrbSlam3DVisualization
            trajectory={trajectory}
            currentPose={currentPose}
            trackedPoints={trackedPoints}
            allMapPoints={allMapPoints}
            showGrid={showGrid}
          />
        </div>
      </div>

      {/* Video Tracker - Bottom */}
      <div className="w-full">
        <div className="w-full" style={{ height: canvasHeight }}>
          <CanvasVideoTracker
            videoUrl={videoUrl}
            currentFrame={currentFrame}
            points2D={points2D}
            width={videoWidth}
            height={videoHeight}
          />
        </div>
      </div>
    </div>
  );
};

export default CombinedVisualization;
