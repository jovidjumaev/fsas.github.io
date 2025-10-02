import { ComponentProps } from '@/types';

interface CardProps extends ComponentProps {
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ 
  children, 
  variant = 'default', 
  className = '',
  onClick
}: CardProps) {
  const baseClasses = 'card';
  const variantClasses = {
    default: 'bg-white',
    outlined: 'border-2',
    elevated: 'shadow-lg'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: ComponentProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: ComponentProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: ComponentProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
