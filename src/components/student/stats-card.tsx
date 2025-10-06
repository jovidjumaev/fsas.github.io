import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  isLoading: boolean;
}

export const StatsCard = React.memo<StatsCardProps>(({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading
}) => {
  return (
    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 h-32">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
            {title}
          </p>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center ml-4`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';
