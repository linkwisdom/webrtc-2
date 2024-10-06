import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

interface WebRTCManagerProps {
  localStream: MediaStream | null;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (connected: boolean) => void;
}

const WebRTCManager: React.FC<WebRTCManagerProps> = ({ localStream, onRemoteStream, onConnectionStateChange }) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    // 初始化 Socket.IO 连接
    socketRef.current = io('http://127.0.0.1:5000');

    // 设置 Socket.IO 事件监听器
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      createPeerConnection();
    }
  }, [localStream]);

  // 创建 RTCPeerConnection
  const createPeerConnection = () => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current!.emit('ice-candidate', event.candidate);
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      onConnectionStateChange(peerConnectionRef.current!.connectionState === 'connected');
    };

    localStream!.getTracks().forEach((track) => {
      peerConnectionRef.current!.addTrack(track, localStream!);
    });
  };

  // 处理接收到的 Offer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current!.createAnswer();
    await peerConnectionRef.current!.setLocalDescription(answer);
    socketRef.current!.emit('answer', answer);
  };

  // 处理接收到的 Answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // 处理接收到的 ICE Candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    await peerConnectionRef.current!.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // 发起呼叫
  const startCall = async () => {
    const offer = await peerConnectionRef.current!.createOffer();
    await peerConnectionRef.current!.setLocalDescription(offer);
    socketRef.current!.emit('offer', offer);
  };

  return null; // 这个组件不渲染任何 UI 元素
};

export default WebRTCManager;