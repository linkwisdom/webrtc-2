import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  label: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, muted = false, autoPlay = true, playsInline = true, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const detectFaces = async () => {
        if (video.paused || video.ended) return;

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        requestAnimationFrame(detectFaces);
      };

      video.addEventListener('play', detectFaces);

      return () => {
        video.removeEventListener('play', detectFaces);
      };
    }
  }, [modelsLoaded]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        className="w-80 h-60 bg-black rounded-lg shadow-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">{label}</p>
    </div>
  );
};

export default VideoPlayer;