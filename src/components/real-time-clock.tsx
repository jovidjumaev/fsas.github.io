'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface RealTimeClockProps {
  className?: string;
  showIcon?: boolean;
}

export default function RealTimeClock({ className = '', showIcon = true }: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg ${className}`}>
      {showIcon && <Clock className="w-4 h-4 text-slate-500" />}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}