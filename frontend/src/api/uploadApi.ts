import { API_CONFIG } from './config';
import type { UploadResponse, ProcessingResponse } from './config';

/**
 * Upload file without streaming progress
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.upload.regular}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Upload file with streaming progress using SSE (Server-Sent Events)
 */
export const uploadFileWithProgress = async (
  file: File,
  onProgress?: (progress: number, uploaded: number, total: number) => void
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch for SSE
    fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.upload.stream}`, {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let uploadResult: UploadResponse | null = null;
        let processingStarted = false;

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        // Read SSE stream
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                // Handle different event types
                if (data.type === 'progress') {
                  const progress = Math.round((data.uploaded / data.total) * 100);
                  onProgress?.(progress, data.uploaded, data.total);
                } else if (data.type === 'complete') {
                  uploadResult = {
                    type: 'complete',
                    id: data.id,
                    filename: data.filename,
                    path: data.path,
                    size: data.size
                  };
                } else if (data.type === 'processing_started') {
                  // Backend has started processing, use processing_id instead of file_id
                  if (uploadResult) {
                    uploadResult.id = data.processing_id;
                  }
                  processingStarted = true;
                  // Resolve with processing_id after receiving processing_started event
                  if (uploadResult) {
                    resolve(uploadResult);
                    return;
                  }
                } else if (data.type === 'error') {
                  reject(new Error(data.message));
                  return;
                }
              } catch (error) {
                console.error('Error parsing SSE message:', error);
              }
            }
          }
        }

        // Fallback: if stream ended without processing_started event
        if (uploadResult && !processingStarted) {
          resolve(uploadResult);
        } else if (!uploadResult) {
          reject(new Error('Upload completed but no result received'));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

/**
 * Subscribe to processing status updates via Server-Sent Events
 */
export const subscribeToProcessingStatus = (
  id: string,
  onUpdate: (response: ProcessingResponse) => void,
  intervalOrOnError?: number | ((error: Error) => void)
): { stop: () => void } => {
  // Handle backward compatibility: interval parameter is ignored for SSE
  const onError = typeof intervalOrOnError === 'function' ? intervalOrOnError : undefined;
  
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.processing}/${id}`;
  console.log('[subscribeToProcessingStatus] Connecting to SSE:', url);
  
  const eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[subscribeToProcessingStatus] Received data:', data);
      
      // Transform SSE 'update' type to 'progress' type for frontend
      if (data.type === 'update') {
        const progressResponse: ProcessingResponse = {
          type: 'progress',
          id: data.id,
          status: data.status,
          processed_frames: data.processed_frames,
          total_frames: data.total_frames,
          progress: data.progress,
	      keypoints_2d: data.keypoints_2d,
          current_pose: data.current_pose,
          tracked_points_count: data.tracked_points_count,
          tracked_points: data.tracked_points || [],
          all_map_points: data.all_map_points || [],
          trajectory: data.trajectory || []
        };
        onUpdate(progressResponse);
      } else if (data.type === 'complete') {
        const completeResponse: ProcessingResponse = {
          type: 'complete',
          id: data.id,
          status: data.status,
          processed_frames: data.processed_frames,
          total_frames: data.total_frames,
          trajectory: data.trajectory,
          all_map_points: data.all_map_points || [],
          error: data.error
        };
        onUpdate(completeResponse);
        eventSource.close();
      } else if (data.type === 'error') {
        const errorResponse: ProcessingResponse = {
          type: 'error',
          id: data.id,
          status: data.status,
          error: data.error || data.message || 'Unknown error'
        };
        onUpdate(errorResponse);
        eventSource.close();
      }
    } catch (error) {
      console.error('[subscribeToProcessingStatus] Error parsing SSE data:', error);
      onError?.(error as Error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('[subscribeToProcessingStatus] SSE error:', error);
    eventSource.close();
    onError?.(new Error('SSE connection error'));
  };
  
  return {
    stop: () => {
      console.log('[subscribeToProcessingStatus] Closing SSE connection');
      eventSource.close();
    }
  };
};

/**
 * Legacy polling function - deprecated, use subscribeToProcessingStatus instead
 * Kept for backward compatibility
 */
export const pollProcessingStatus = subscribeToProcessingStatus;
