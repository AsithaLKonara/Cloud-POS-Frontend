import React from 'react';

export interface MetricCardConfig {
  title: string;
  value: string | number;
  subText?: React.ReactNode;
  theme?: 'red' | 'orange' | 'white-blue' | 'white-stone';
  progress?: number; // 0-100 for the bottom progress bar
}

export interface StatusPillConfig {
  label: string;
  value: string | number;
  colorClass: string; // e.g. "bg-orange-50 text-orange-700"
}

export interface AdminStatCardsProps {
  metrics: MetricCardConfig[];
  statuses?: StatusPillConfig[];
}

export default function AdminStatCards({ metrics, statuses }: AdminStatCardsProps) {
  return (
    <div className="w-full">
      {/* Top Metric Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(metrics.length, 4)} gap-4 mb-6`}>
        {metrics.map((metric, idx) => {
          let containerClass = "rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ";
          let titleClass = "text-[11px] font-bold uppercase tracking-wider mb-2 ";
          let valueClass = "text-3xl font-extrabold tracking-tight ";
          
          if (metric.theme === 'red') {
            containerClass += "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-amber-600/10";
            titleClass += "text-amber-100";
            valueClass += "text-white";
          } else if (metric.theme === 'orange') {
            containerClass += "bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300";
            titleClass += "text-amber-600 dark:text-amber-400";
            valueClass += "text-amber-700 dark:text-amber-200";
          } else if (metric.theme === 'white-blue') {
            containerClass += "bg-surface border border-blue-500/20 text-foreground";
            titleClass += "text-blue-600 dark:text-blue-400";
            valueClass += "text-foreground";
          } else {
            // white-stone default
            containerClass += "bg-surface border border-border text-foreground";
            titleClass += "text-muted";
            valueClass += "text-foreground";
          }

          return (
            <div key={idx} className={containerClass}>
              <div>
                <p className={titleClass}>{metric.title}</p>
                <p className={valueClass}>{metric.value}</p>
              </div>
              {metric.subText && (
                <div className="mt-4">
                  {metric.subText}
                </div>
              )}
              {metric.progress !== undefined && metric.theme === 'red' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-white/60" style={{ width: `${Math.min(Math.max(metric.progress, 0), 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Breakdown Pills */}
      {statuses && statuses.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Status Breakdown</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {statuses.map((stat, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border border-border/70 ${stat.colorClass}`}>
                <div className="text-lg font-black">{stat.value}</div>
                <div className="text-xs font-semibold leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
