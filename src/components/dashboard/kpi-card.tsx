import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlight?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 border-[#1f252e] bg-[#0c1016]",
        highlight && "border-indigo-500/30 glow-subtle"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border",
              highlight
                ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                : "bg-[#141922] border-[#222a36] text-slate-400"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

