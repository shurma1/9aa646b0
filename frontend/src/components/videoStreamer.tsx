import React, { useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC.ts';

export const VideoStreamComponent: React.FC = () => {
	const [error, setError] = useState<string | null>(null);
	const { startStreaming, stopStreaming, isConnected, recordingFile } = useWebRTC({
		serverUrl: 'http://localhost:8080',
		maxBitrate: 3_000_000,
		onError: (e) => setError(e.message),
	});
	
	return (
		<div>
			<h2>WebRTC Upload</h2>
			<button disabled={isConnected} onClick={() => startStreaming()}>Start</button>
			<button disabled={!isConnected} onClick={() => stopStreaming()}>Stop</button>
			<p>Status: {isConnected ? 'Streaming' : 'Idle'}</p>
			{recordingFile && <p>Last file: {recordingFile}</p>}
			{error && <p style={{color:'red'}}>Error: {error}</p>}
			<p style={{fontSize:'0.85em'}}>Tip: For progressive playback choose webm container (default).</p>
		</div>
	);
};
