import React from 'react';

interface KeyframeEvent {
  type: 'audio' | 'video';
  timestamp: number;
  imageData: string;
}

interface KeyframeTimelineProps {
  events: KeyframeEvent[];
}

const KeyframeTimeline: React.FC<KeyframeTimelineProps> = ({ events }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 p-2 min-w-max">
        {events.map((event, index) => (
          <div key={index} className="flex flex-col items-center">
            <img src={event.imageData} alt={`Keyframe ${index}`} className="w-20 h-15 object-cover" />
            <span className="text-xs mt-1">{new Date(event.timestamp).toLocaleTimeString()}</span>
            <span className="text-xs">{event.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyframeTimeline;