import React from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const colorVariants = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
};

export default function StatCard({ title, value, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
            {trend && (
              <div className="flex items-center mt-2">
                <span
                  className={cn(
                    'text-sm font-medium flex items-center',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                    </svg>
                  )}
                  {trend.value}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-white', colorVariants[color])}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
