import React, { useCallback } from 'react';
import { useUpload } from './useUpload';
import type { ProcessingResponse } from './config';
import './UploadExample.css';

const UploadExample: React.FC = () => {
  const [state, actions] = useUpload({
    withProgress: true,
    onUploadProgress: (progress, uploaded, total) => {
      console.log(`Upload progress: ${progress}% (${uploaded}/${total} bytes)`);
    },
    onProcessingUpdate: (response: ProcessingResponse) => {
      console.log('Processing update:', response);
    },
    pollingInterval: 2000 // Poll every 2 seconds
  });

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      actions.upload(file);
    }
  }, [actions]);

  const handleReset = useCallback(() => {
    actions.reset();
  }, [actions]);

  return (
    <div className="upload-example">
      <h2>File Upload & Processing</h2>
      
      {/* File Input */}
      <div className="upload-section">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={state.isUploading || state.isProcessing}
        />
        
        {!state.isComplete && (
          <button onClick={handleReset}>Reset</button>
        )}
      </div>

      {/* Upload Progress */}
      {state.isUploading && (
        <div className="upload-progress">
          <h3>Uploading...</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${state.uploadProgress}%` }}
            />
          </div>
          <span>{state.uploadProgress}%</span>
        </div>
      )}

      {/* Upload Error */}
      {state.uploadError && (
        <div className="error">
          <h3>Upload Error</h3>
          <p>{state.uploadError}</p>
        </div>
      )}

      {/* Upload Result */}
      {state.uploadResult && state.uploadResult.type === 'complete' && (
        <div className="upload-result">
          <h3>Upload Complete</h3>
          <p>File ID: {state.uploadResult.id}</p>
          <p>Filename: {state.uploadResult.filename}</p>
          <p>Size: {(state.uploadResult.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      {/* Processing Progress */}
      {state.isProcessing && (
        <div className="processing-progress">
          <h3>Processing Video...</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${state.processingProgress}%` }}
            />
          </div>
          <span>{state.processingProgress}%</span>
          
          {state.processingResult && state.processingResult.type !== 'complete' && (
            <p>
              Processed {state.processingResult.processed_frames} / {state.processingResult.total_frames} frames
            </p>
          )}
        </div>
      )}

      {/* Processing Complete */}
      {state.processingResult && state.processingResult.type === 'complete' && (
        <div className="processing-result">
          <h3>Processing Complete!</h3>
          <p>Status: {state.processingResult.status}</p>
          <p>Total Frames: {state.processingResult.total_frames}</p>
          <p>Processed Frames: {state.processingResult.processed_frames}</p>
          <p>Trajectory Points: {state.processingResult.trajectory.length}</p>
          
          {/* Show first few trajectory points as example */}
          <details>
            <summary>Trajectory Data (first 3 points)</summary>
            <pre>
              {JSON.stringify(state.processingResult.trajectory.slice(0, 3), null, 2)}
            </pre>
          </details>
        </div>
      )}


    </div>
  );
};

export default UploadExample;