import React from 'react';
import { Video, Phone, PhoneOff, VideoOff } from 'lucide-react';

interface ControlButtonsProps {
  localStream: MediaStream | null;
  isConnected: boolean;
  isRecording: boolean;
  onStartVideo: () => void;
  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  localStream,
  isConnected,
  isRecording,
  onStartVideo,
  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <div className="flex gap-4 mb-8">
      {!localStream && (
        <button
          onClick={onStartVideo}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Video className="mr-2" /> Start Video
        </button>
      )}
      {localStream && !isConnected && (
        <button
          onClick={onStartCall}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Phone className="mr-2" /> Start Call
        </button>
      )}
      {isConnected && (
        <button
          onClick={onEndCall}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <PhoneOff className="mr-2" /> End Call
        </button>
      )}
      {localStream && !isRecording && (
        <button
          onClick={onStartRecording}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Video className="mr-2" /> Start Recording
        </button>
      )}
      {isRecording && (
        <button
          onClick={onStopRecording}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <VideoOff className="mr-2" /> Stop Recording
        </button>
      )}
    </div>
  );
};

export default ControlButtons;