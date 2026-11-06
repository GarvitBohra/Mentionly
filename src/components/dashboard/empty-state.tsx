import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#242b35] bg-[#0c1015]/60 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#242b35] bg-[#131821] text-indigo-400 mb-4 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-slate-400 leading-relaxed">{description}</p>
      {(actionText && (actionHref || onAction)) && (
        <div className="mt-5">
          {actionHref ? (
            <Link href={actionHref}>
              <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                {actionText}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="primary" onClick={onAction} className="gap-1.5 text-xs">
              {actionText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

