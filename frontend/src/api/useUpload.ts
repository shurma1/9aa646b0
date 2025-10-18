import { useState, useCallback, useRef } from 'react';
import { uploadFile, uploadFileWithProgress, pollProcessingStatus } from './uploadApi';
import type { UploadResponse, ProcessingResponse } from './config';

export interface UseUploadOptions {
  withProgress?: boolean;
  onUploadProgress?: (progress: number, uploaded: number, total: number) => void;
  onProcessingUpdate?: (response: ProcessingResponse) => void;
  pollingInterval?: number;
}

export interface UseUploadState {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadResult: UploadResponse | null;
  
  // Processing state
  isProcessing: boolean;
  processingProgress: number;
  processingError: string | null;
  processingResult: ProcessingResponse | null;
  
  // Combined state
  isComplete: boolean;
}

export interface UseUploadActions {
  upload: (file: File) => Promise<void>;
  reset: () => void;
  stopProcessingPoll: () => void;
}

export const useUpload = (options: UseUploadOptions = {}): [UseUploadState, UseUploadActions] => {
  const {
    withProgress = false,
    onUploadProgress,
    onProcessingUpdate,
    pollingInterval = 1000
  } = options;

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResponse | null>(null);

  // Refs for cleanup
  const pollingControlRef = useRef<{ stop: () => void } | null>(null);

  // Actions
  const upload = useCallback(async (file: File) => {
    // Reset state
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingError(null);
    setProcessingResult(null);

    try {
      let result: UploadResponse;

      if (withProgress) {
        result = await uploadFileWithProgress(file, (progress, uploaded, total) => {
          setUploadProgress(progress);
          onUploadProgress?.(progress, uploaded, total);
        });
      } else {
        result = await uploadFile(file);
      }

      setUploadResult(result);
      setIsUploading(false);

      // If upload is complete, start processing polling
      if (result.type === 'complete') {
        setIsProcessing(true);
        
        pollingControlRef.current = pollProcessingStatus(
          result.id,
          (response) => {
            setProcessingResult(response);
            onProcessingUpdate?.(response);

            if (response.type === 'progress') {
              const progress = Math.round((response.processed_frames / response.total_frames) * 100);
              setProcessingProgress(progress);
            } else if (response.type === 'complete') {
              setIsProcessing(false);
              setProcessingProgress(100);
            } else if (response.type === 'error') {
              setIsProcessing(false);
              setProcessingError(response.error);
            }
          },
          pollingInterval
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      setIsUploading(false);
    }
  }, [withProgress, onUploadProgress, onProcessingUpdate, pollingInterval]);

  const reset = useCallback(() => {
    // Stop polling if active
    pollingControlRef.current?.stop();
    pollingControlRef.current = null;

    // Reset all state
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingError(null);
    setProcessingResult(null);
  }, []);

  const stopProcessingPoll = useCallback(() => {
    pollingControlRef.current?.stop();
    pollingControlRef.current = null;
    setIsProcessing(false);
  }, []);

  // Computed state
  const isComplete = !isUploading && !isProcessing && 
    processingResult?.type === 'complete';

  const state: UseUploadState = {
    isUploading,
    uploadProgress,
    uploadError,
    uploadResult,
    isProcessing,
    processingProgress,
    processingError,
    processingResult,
    isComplete
  };

  const actions: UseUploadActions = {
    upload,
    reset,
    stopProcessingPoll
  };

  return [state, actions];
};