import React, { useState, useRef } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ControlButtons from './components/ControlButtons';
import KeyframeTimeline from './components/KeyframeTimeline';
import WebRTCManager from './components/WebRTCManager';
import KeyframeCapture from './components/KeyframeCapture';

interface KeyframeEvent {
  type: 'audio' | 'video';
  timestamp: number;
  imageData: string;
}

const App: React.FC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [keyframeEvents, setKeyframeEvents] = useState<KeyframeEvent[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // 开始本地视频
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  // 开始录制
  const startRecording = () => {
    if (!localStream) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(localStream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;
  };

  // 停止录制
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = 'recorded-video.webm';
      a.click();
      window.URL.revokeObjectURL(url);
    };
  };

  // 结束通话
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setKeyframeEvents([]);
  };

  // 处理关键帧捕获
  const handleKeyframeCapture = (event: KeyframeEvent) => {
    setKeyframeEvents(prev => [...prev, event]);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">WebRTC Remote Video</h1>
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <VideoPlayer stream={localStream} muted label="Local" />
        <VideoPlayer stream={remoteStream} label="Remote" />
      </div>
      <ControlButtons
        localStream={localStream}
        isConnected={isConnected}
        isRecording={isRecording}
        onStartVideo={startVideo}
        onStartCall={() => {}} // 这里需要实现开始通话的逻辑
        onEndCall={endCall}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />
      <KeyframeTimeline events={keyframeEvents} />
      {localStream && (
        <>
          <WebRTCManager
            localStream={localStream}
            onRemoteStream={setRemoteStream}
            onConnectionStateChange={setIsConnected}
          />
          <KeyframeCapture
            stream={localStream}
            onKeyframeCapture={handleKeyframeCapture}
          />
        </>
      )}
    </div>
  );
};

export default App;