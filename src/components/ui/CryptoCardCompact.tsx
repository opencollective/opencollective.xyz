import { DollarSign } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface CryptoCardProps {
  symbol?: string;
  name: string;
  netAmount: number;
  inbound: number;
  outbound: number;
  iconUrl?: string;
  className?: string;
}

const CryptoCardCompact = ({
  symbol,
  name,
  netAmount,
  inbound,
  outbound,
  iconUrl,
  className,
}: CryptoCardProps) => {
  const isPositive = netAmount >= 0;

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-lg border bg-white dark:bg-slate-800 p-1 sm:p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left: Coin info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700">
            {iconUrl ? (
              <img src={iconUrl} alt={symbol} className="w-5 h-5" />
            ) : (
              <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white text-sm sm:text-lg">
              {symbol}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{name}</p>
          </div>
        </div>

        {/* Right: Net amount */}
        <div
          className={cn(
            "text-right",
            isPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          )}
        >
          <div className="text-base sm:text-lg font-bold">
            {isPositive ? "+" : ""}
            {netAmount.toFixed(2)}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-500">
              ↑{formatNumber(inbound, 2)}
            </span>
            <span className="text-rose-500">↓{formatNumber(outbound, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoCardCompact;
