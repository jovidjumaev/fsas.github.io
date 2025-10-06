import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, QrCode } from 'lucide-react';

interface ClassCardProps {
  id: string;
  class_code: string;
  class_name: string;
  time: string;
  room: string;
  professor: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export const ClassCard = React.memo<ClassCardProps>(({
  id,
  class_code,
  class_name,
  time,
  room,
  professor,
  status
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400';
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400';
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {class_code}
            </h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {class_name}
          </h4>
          <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center font-medium">
              <Clock className="w-3 h-3 mr-1" />
              {time}
            </span>
            <span className="flex items-center font-medium">
              <MapPin className="w-3 h-3 mr-1" />
              {room}
            </span>
            <span className="flex items-center font-medium">
              <User className="w-3 h-3 mr-1" />
              {professor}
            </span>
          </div>
        </div>
        <div className="ml-4">
          <Link href="/student/scan">
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              <QrCode className="w-4 h-4 mr-1" />
              Scan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
});

ClassCard.displayName = 'ClassCard';
