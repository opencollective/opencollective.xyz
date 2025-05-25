"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
interface Props {
  value: string;
  secret?: boolean;
  label?: string;
  truncate?: boolean;
  className?: string;
}

export default function CopyableValue({
  value,
  secret = false,
  label,
  className,
  truncate = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!secret);

  const displayValue = () => {
    if (!revealed) return truncate ? "••••••••" : value.replace(/./g, "*");
    if (truncate) return `${value.slice(0, 6)}…${value.slice(-4)}`;
    return value;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && <div className="text-sm text-gray-500">{label}</div>}
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-0 bg-gray-50 rounded-lg",
          className
        )}
      >
        <div
          className={cn("font-mono text-sm text-gray-600 truncate", className)}
        >
          {displayValue()}
        </div>
        <div className="flex gap-1">
          {secret && (
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              title={revealed ? "Hide value" : "Show value"}
            >
              {revealed ? (
                <EyeOffIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <EyeIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <CopyIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Icon components
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
