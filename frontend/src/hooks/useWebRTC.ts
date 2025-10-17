import { useRef, useCallback, useEffect, useState } from 'react';

interface UseWebRTCVideoStreamOptions {
	serverUrl: string;
	onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
	onError?: (error: Error) => void;
	maxBitrate?: number; // in bps
}

interface StartResult {
	pcId: string;
	fileName: string;
}

export const useWebRTC = ({
							  serverUrl,
							  onConnectionStateChange,
							  onError,
							  maxBitrate = 3_000_000, // 3 Mbps default
						  }: UseWebRTCVideoStreamOptions) => {
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const pcIdRef = useRef<string | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [recordingFile, setRecordingFile] = useState<string | null>(null);
	
	// --- SDP фильтрация кодека ---
	const sdpFilterCodec = (kind: string, codec: string, sdp: string): string => {
		const allowed: number[] = [];
		const rtxRegex = /a=fmtp:(\d+) apt=(\d+)\r$/;
		const codecRegex = new RegExp(`a=rtpmap:([0-9]+) ${codec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
		const mediaRegex = new RegExp(`(m=${kind} .*?)( ([0-9]+))*\\s*$`);
		const lines = sdp.split('\n');
		
		let isMedia = false;
		for (const line of lines) {
			if (line.startsWith(`m=${kind} `)) {
				isMedia = true;
			} else if (line.startsWith('m=')) {
				isMedia = false;
			}
			if (isMedia) {
				const m = line.match(codecRegex);
				if (m) allowed.push(parseInt(m[1]));
				const rtx = line.match(rtxRegex);
				if (rtx && allowed.includes(parseInt(rtx[2]))) {
					allowed.push(parseInt(rtx[1]));
				}
			}
		}
		
		const skipRegex = /a=(fmtp|rtcp-fb|rtpmap):([0-9]+)/;
		let filtered = '';
		isMedia = false;
		for (const line of lines) {
			if (line.startsWith(`m=${kind} `)) {
				isMedia = true;
			} else if (line.startsWith('m=')) {
				isMedia = false;
			}
			if (isMedia) {
				const skip = line.match(skipRegex);
				if (skip && !allowed.includes(parseInt(skip[2]))) continue;
				if (line.match(mediaRegex)) {
					filtered += line.replace(mediaRegex, `$1 ${allowed.join(' ')}`) + '\n';
				} else {
					filtered += line + '\n';
				}
			} else {
				filtered += line + '\n';
			}
		}
		return filtered;
	};
	
	// --- Принудительно задаём H.264 High Profile ---
	const forceH264HighProfile = (sdp: string): string => {
		return sdp.replace(
			/a=fmtp:(\d+) profile-level-id=[0-9A-Fa-f]+;?.*/g,
			'a=fmtp:$1 profile-level-id=640029;packetization-mode=1'
		);
	};
	
	// --- SDP negotiation ---
	const negotiate = useCallback(async (pc: RTCPeerConnection) => {
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		
		await new Promise<void>((resolve) => {
			if (pc.iceGatheringState === 'complete') return resolve();
			const check = () => {
				if (pc.iceGatheringState === 'complete') {
					pc.removeEventListener('icegatheringstatechange', check);
					resolve();
				}
			};
			pc.addEventListener('icegatheringstatechange', check);
		});
		
		let sdp = pc.localDescription!.sdp;
		sdp = sdpFilterCodec('video', 'H264/90000', sdp);
		sdp = forceH264HighProfile(sdp);
		
		const resp = await fetch(`${serverUrl}/offer`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sdp, type: pc.localDescription!.type })
		});
		const answer = await resp.json();
		pcIdRef.current = answer.id;
		setRecordingFile(answer.file);
		await pc.setRemoteDescription(answer);
	}, [serverUrl]);
	
	// --- Настройки кодирования ---
	const applyEncodingParameters = async (pc: RTCPeerConnection) => {
		const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
		if (!sender) return;
		
		const params = sender.getParameters();
		if (!params.encodings || params.encodings.length === 0) {
			params.encodings = [{}];
		}
		
		const encoding = params.encodings[0] as any;
		encoding.maxBitrate = maxBitrate;
		encoding.maxFramerate = 10;
		encoding.scaleResolutionDownBy = 1.0;
		
		// добавляем неофициальные поля через каст
		encoding.minBitrate = 2_000_000;
		
		params.degradationPreference = 'maintain-resolution' as any;
		
		try {
			await sender.setParameters(params);
			
			// WebRTC типы не знают о requestKeyFrame — вызываем через any
			setTimeout(() => {
				(sender as any)?.requestKeyFrame?.();
			}, 500);
		} catch (e) {
			console.warn('Could not set encoding parameters', e);
		}
	};
	
	// --- Запуск трансляции ---
	const startStreaming = useCallback(async (): Promise<StartResult | null> => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 10, max: 10 }
				},
				audio: false
			});
			
			streamRef.current = stream;
			
			const pc = new RTCPeerConnection({ sdpSemantics: 'unified-plan' });
			pcRef.current = pc;
			
			pc.addEventListener('connectionstatechange', () => {
				const st = pc.connectionState;
				setIsConnected(st === 'connected');
				onConnectionStateChange?.(st);
			});
			
			for (const track of stream.getTracks()) {
				pc.addTrack(track, stream);
			}
			
			await negotiate(pc);
			await applyEncodingParameters(pc);
			
			return {
				pcId: pcIdRef.current!,
				fileName: recordingFile || ''
			};
		} catch (err) {
			onError?.(err as Error);
			return null;
		}
	}, [negotiate, onConnectionStateChange, onError, recordingFile, maxBitrate]);
	
	// --- Остановка ---
	const stopStreaming = useCallback(async () => {
		if (pcIdRef.current) {
			try {
				await fetch(`${serverUrl}/close/${pcIdRef.current}`, { method: 'POST' });
			} catch { /* ignore */ }
		}
		
		if (pcRef.current) {
			await new Promise(r => setTimeout(r, 300));
			try { pcRef.current.close(); } catch {}
			pcRef.current = null;
		}
		
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(t => t.stop());
			streamRef.current = null;
		}
		
		setIsConnected(false);
	}, [serverUrl]);
	
	useEffect(() => {
		return () => { stopStreaming(); };
	}, [stopStreaming]);
	
	return {
		startStreaming,
		stopStreaming,
		isConnected,
		recordingFile
	};
};
