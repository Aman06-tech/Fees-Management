import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-100', className)} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('px-6 py-4 bg-gray-50 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  );
};
