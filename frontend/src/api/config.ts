// API Configuration
export const API_CONFIG = {
  baseURL: 'http://192.168.64.4:8000/api',
  endpoints: {
    upload: {
      regular: '/upload',
      stream: '/upload/stream'
    },
    processing: '/processing'
  }
} as const;

// Response types
export interface UploadProgressResponse {
  type: 'progress';
  progress: number;
  uploaded: number;
  total: number;
}

export interface UploadCompleteResponse {
  type: 'complete';
  id: string;
  filename: string;
  path: string;
  size: number;
}

export type UploadResponse = UploadProgressResponse | UploadCompleteResponse;

export interface ProcessingPose {
  frame: number;
  pose: number[][]; // 4x4 transformation matrix
}

export interface ProcessingCompleteResponse {
  type: 'complete';
  id: string;
  status: 'completed';
  processed_frames: number;
  total_frames: number;
  keypoints_2d: Array<{ x: number; y: number }>;
  trajectory: ProcessingPose[];
  all_map_points?: Array<{ x: number; y: number; z: number }>; // All accumulated map points
  error?: null;
}

export interface ProcessingProgressResponse {
  type: 'progress';
  id: string;
  status: 'processing' | 'queued' | 'initializing';
  processed_frames: number;
  total_frames: number;
  progress: number;
  current_pose?: number[][] | null; // Current 4x4 transformation matrix
  tracked_points_count?: number; // Number of tracked feature points
  tracked_points?: Array<{ x: number; y: number; z: number }>; // Current ORB feature points (3D)
  keypoints_2d?: Array<{ x: number; y: number }>; // Current 2D keypoints on image
  all_map_points?: Array<{ x: number; y: number; z: number }>; // All accumulated map points
  trajectory?: ProcessingPose[]; // Partial trajectory (all poses collected so far)
}

export interface ProcessingErrorResponse {
  type: 'error';
  id: string;
  status: 'error' | 'failed';
  error: string;
}

export type ProcessingResponse = ProcessingCompleteResponse | ProcessingProgressResponse | ProcessingErrorResponse;
