import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentClass } from '@/lib/student-classes-service';
import { 
  QrCode, 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  TrendingUp,
  Eye
} from 'lucide-react';

interface ClassCardOptimizedProps {
  classData: StudentClass;
}

export const ClassCardOptimized = React.memo(({ classData }: ClassCardOptimizedProps) => {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
    if (rate >= 75) return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {classData.class_code}
          </h3>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {classData.class_name}
          </h4>
          {classData.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
              {classData.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
          <User className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{classData.professor}</span>
        </div>
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{classData.room}</span>
        </div>
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{classData.schedule}</span>
        </div>
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
          <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{classData.credits} credits • {classData.department_code}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Attendance
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAttendanceColor(classData.attendance_rate)}`}>
            {classData.attendance_rate}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              classData.attendance_rate >= 90 ? 'bg-emerald-500' :
              classData.attendance_rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${classData.attendance_rate}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {classData.attended_sessions} of {classData.total_sessions} sessions
        </p>
      </div>

      <div className="flex space-x-2">
        <Link href={`/student/classes/${classData.class_id}`} className="flex-1">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </Link>
        <Link href="/student/scan">
          <Button 
            variant="outline" 
            size="sm"
            className="border-slate-300 dark:border-slate-600"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
});

ClassCardOptimized.displayName = 'ClassCardOptimized';
