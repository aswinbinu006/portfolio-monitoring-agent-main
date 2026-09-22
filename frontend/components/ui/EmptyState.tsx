import React from "react";
import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText = "Import Portfolio CSV",
  actionHref = "/portfolio",
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 bg-white border border-slate-200 border-dashed rounded-xl shadow-subtle max-w-lg mx-auto my-8">
      {icon ? (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
          {icon}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {actionHref ? (
        <Link href={actionHref}>
          <Button variant="primary" size="md">
            {actionText}
          </Button>
        </Link>
      ) : onAction ? (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
    </div>
  );
}
