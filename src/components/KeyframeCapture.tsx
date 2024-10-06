import { useEffect, useRef, useState } from 'react';

interface KeyframeEvent {
  type: 'audio' | 'video';
  timestamp: number;
  imageData: string;
}

interface KeyframeCaptureProps {
  stream: MediaStream | null;
  onKeyframeCapture: (event: KeyframeEvent) => void;
}

const KeyframeCapture: React.FC<KeyframeCaptureProps> = ({ stream, onKeyframeCapture }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousImageDataRef = useRef<ImageData | null>(null);
  const lastVideoCaptureTimeRef = useRef<number>(0);

  useEffect(() => {
    if (stream) {
      startKeyframeCapture(stream);
    }
  }, [stream]);

  // 开始关键帧捕获
  const startKeyframeCapture = (stream: MediaStream) => {
    // 设置音频分析
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    source.connect(analyser);

    // 设置视频分析
    canvasRef.current = document.createElement('canvas');
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.play();

    const captureInterval = setInterval(() => {
      // 音频分析
      const audioData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(audioData);
      const audioLevel = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;

      // 视频分析
      ctx.drawImage(videoElement, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      const imageData = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      const currentTime = Date.now();

      // 检查音频关键帧
      if (audioLevel > 128) { // 调整此阈值以适应您的需求
        captureKeyframe('audio', imageData);
      }

      // 检查视频关键帧（每3秒）
      if (currentTime - lastVideoCaptureTimeRef.current >= 3000) {
        if (previousImageDataRef.current) {
          const diff = calculateImageDifference(previousImageDataRef.current, imageData);
          if (diff > 0.1) { // 降低阈值，因为我们现在每3秒才检查一次
            captureKeyframe('video', imageData);
            lastVideoCaptureTimeRef.current = currentTime;
          }
        }
        previousImageDataRef.current = imageData;
      }
    }, 100); // 保持较短的间隔以确保音频检测的响应性

    return () => clearInterval(captureInterval);
  };

  // 捕获关键帧
  const captureKeyframe = (type: 'audio' | 'video', imageData: ImageData) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx!.putImageData(imageData, 0, 0);
    
    const event: KeyframeEvent = {
      type,
      timestamp: Date.now(),
      imageData: canvas.toDataURL(),
    };

    onKeyframeCapture(event);
  };

  // 计算图像差异
  const calculateImageDifference = (prev: ImageData, current: ImageData) => {
    let diff = 0;
    for (let i = 0; i < prev.data.length; i += 4) {
      diff += Math.abs(prev.data[i] - current.data[i]);
      diff += Math.abs(prev.data[i+1] - current.data[i+1]);
      diff += Math.abs(prev.data[i+2] - current.data[i+2]);
    }
    return diff / (prev.width * prev.height * 3);
  };

  return null; // 这个组件不渲染任何 UI 元素
};

export default KeyframeCapture;