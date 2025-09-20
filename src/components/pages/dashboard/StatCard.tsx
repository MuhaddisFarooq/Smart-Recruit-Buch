import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'pink';
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle, 
  className = '',
  variant = 'default' 
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          card: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-xl hover:shadow-2xl',
          icon: 'text-white/90',
          title: 'text-emerald-100',
          value: 'text-white',
          subtitle: 'text-emerald-100',
          iconBg: 'bg-white/20'
        };
      case 'success':
        return {
          card: 'bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-xl hover:shadow-2xl',
          icon: 'text-white/90',
          title: 'text-green-100',
          value: 'text-white',
          subtitle: 'text-green-100',
          iconBg: 'bg-white/20'
        };
      case 'warning':
        return {
          card: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-none shadow-xl hover:shadow-2xl',
          icon: 'text-white/90',
          title: 'text-amber-100',
          value: 'text-white',
          subtitle: 'text-amber-100',
          iconBg: 'bg-white/20'
        };
      case 'info':
        return {
          card: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl hover:shadow-2xl',
          icon: 'text-white/90',
          title: 'text-blue-100',
          value: 'text-white',
          subtitle: 'text-blue-100',
          iconBg: 'bg-white/20'
        };
      case 'purple':
        return {
          card: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-xl hover:shadow-2xl',
          icon: 'text-white/90',
          title: 'text-purple-100',
          value: 'text-white',
          subtitle: 'text-purple-100',
          iconBg: 'bg-white/20'
        };
      case 'pink':
        return {
          card: 'bg-gradient-to-br from-pink-500 to-pink-600 text-white border-none shadow-xl hover:shadow-2xl',
          icon: 'text-white/90',
          title: 'text-pink-100',
          value: 'text-white',
          subtitle: 'text-pink-100',
          iconBg: 'bg-white/20'
        };
      default:
        return {
          card: 'bg-white border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1',
          icon: 'text-gray-600',
          title: 'text-gray-700',
          value: 'text-gray-900',
          subtitle: 'text-gray-500',
          iconBg: 'bg-gradient-to-r from-aaca52 to-emerald-500'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={`${styles.card} group cursor-pointer border-0 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={`text-sm font-medium ${styles.title}`}>
          {title}
        </CardTitle>
        <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
          variant === 'default' ? styles.iconBg : 'bg-white/20'
        }`}>
          <Icon className={`h-5 w-5 ${variant === 'default' ? 'text-white' : styles.icon}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`text-3xl font-bold ${styles.value}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className={`text-sm ${styles.subtitle}`}>
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center gap-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <Badge 
                className={`text-xs border-0 ${
                  variant === 'default' 
                    ? trend.isPositive 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}
              </Badge>
            </div>
          )}
        </div>

        {/* Enhanced progress indicator */}
        {variant === 'default' && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-1.5 rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(20, Math.random() * 100))}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}