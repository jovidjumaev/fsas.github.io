'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface RealTimeClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
  className?: string;
}

export default function RealTimeClock({ 
  showDate = false, 
  showSeconds = false,
  className = ""
}: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    if (showSeconds) {
      options.second = '2-digit';
    }

    return currentTime.toLocaleTimeString('en-US', options);
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-slate-500" />
      <div className="text-sm">
        <div className="font-medium text-slate-700 dark:text-slate-300">
          {formatTime()}
        </div>
        {showDate && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {formatDate()}
          </div>
        )}
      </div>
    </div>
  );
}
