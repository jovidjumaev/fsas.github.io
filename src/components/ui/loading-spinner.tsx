import { ComponentProps } from '@/types';

interface LoadingSpinnerProps extends ComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} loading-spinner`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-fade-in">
          {text}
        </p>
      )}
    </div>
  );
}
