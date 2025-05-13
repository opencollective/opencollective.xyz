import { Button } from "@/components/ui/button";
import { cn, getTransactionDirection } from "@/lib/utils";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfToday } from "date-fns";
import { truncateAddress } from "@/utils/crypto";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ArrowLeftRight, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Coins } from "lucide-react";
import type {
  Address,
  Token,
  TokenType,
  Transaction,
} from "@/types/index.d.ts";

type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

export type Filter = {
  dateRange?: DateRange;
  direction?: "inbound" | "outbound" | "internal" | "all";
  amountRange?: undefined | [number, number];
  chain?: string;
  address?: Address;
  tokenType?: TokenType;
  selectedTokens?: Token[];
};

export default function Filters({
  availableTokens,
  transactions,
  onChange,
  accountAddresses,
}: {
  availableTokens: Token[];
  transactions: Transaction[];
  accountAddresses?: Address[];
  onChange: (filter: Filter) => void;
}) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
    label: "All Time",
  });
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [tokenSelectOpen, setTokenSelectOpen] = useState(false);
  const [direction, setDirection] = useState<
    "inbound" | "outbound" | "internal" | "all"
  >("all");
  const [amountRange, setAmountRange] = useState<undefined | [number, number]>(
    undefined
  );

  type TransactionStats = {
    byMonth: Record<
      string,
      { all: number; inbound: number; outbound: number; internal: number }
    >;
    byType: Record<string, number>;
    total: { all: number; inbound: number; outbound: number; internal: number };
  };

  const transactionStats = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        const month = format(tx.timestamp * 1000, "MMMM yyyy");
        acc.byMonth[month] = acc.byMonth[month] || {
          all: 0,
          inbound: 0,
          outbound: 0,
          internal: 0,
        };
        acc.byMonth[month].all++;
        acc.total.all++;
        if (accountAddresses && accountAddresses.length > 0) {
          const direction = getTransactionDirection(tx, accountAddresses);
          if (direction) {
            acc.byMonth[month][direction]++;
            acc.byType[direction] = (acc.byType[direction] || 0) + 1;
            acc.total[direction] = (acc.total[direction] || 0) + 1;
          }
        }
        return acc;
      },
      {
        byMonth: {},
        byType: { inbound: 0, outbound: 0, internal: 0 },
        total: { all: 0, inbound: 0, outbound: 0, internal: 0 },
      } as TransactionStats
    );
  }, [transactions, accountAddresses]);

  // Generate list of all the months since first transaction
  const monthOptions = useMemo(() => {
    const options: Array<{
      start: Date;
      end: Date;
      label: string;
      txCount: number;
    }> = [];

    if (transactions.length === 0) return options;

    // Find earliest and latest transaction dates
    let firstTx = transactions[0].timestamp;
    let lastTx = transactions[0].timestamp;
    transactions.forEach((tx) => {
      firstTx = Math.min(firstTx, tx.timestamp);
      lastTx = Math.max(lastTx, tx.timestamp);
    });

    // Generate options for each month between first and last transaction
    let currentDate = startOfMonth(new Date(firstTx * 1000));
    const finalMonth = endOfMonth(new Date(lastTx * 1000));

    while (currentDate <= finalMonth) {
      const monthLabel = format(currentDate, "MMMM yyyy");
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      options.push({
        start: monthStart,
        end: monthEnd,
        label: monthLabel,
        txCount: transactionStats.byMonth[monthLabel]
          ? transactionStats.byMonth[monthLabel][direction]
          : 0,
      });

      // Move to next month
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
    }

    return options.reverse();
  }, [transactions, transactionStats, direction]);

  const getAmountRangeLabel = (range: undefined | [number, number]) => {
    if (!range) return "All Amounts";
    if (range[0] === 0) return `< ${range[1]}`;
    if (range[1] === Infinity) return `> ${range[0]}`;
    return `${range[0]} - ${range[1]}`;
  };

  const updateType = (
    direction: "inbound" | "outbound" | "internal" | "all"
  ) => {
    setDirection(direction);
    onChange({ dateRange, selectedTokens, direction, amountRange });
  };

  const updateDateRange = (dateRange: {
    start: Date | null;
    end: Date | null;
    label: string;
  }) => {
    setDateRange(dateRange);
    onChange({ dateRange, selectedTokens, direction, amountRange });
  };

  const updateSelectedTokens = (selectedTokens: Token[]) => {
    setSelectedTokens(selectedTokens);
    onChange({ dateRange, selectedTokens, direction, amountRange });
  };

  const updateAmountRange = (range: undefined | [number, number]) => {
    setAmountRange(range);
    onChange({ dateRange, selectedTokens, direction, amountRange: range });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Filter */}
      {monthOptions.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-[200px] flex-row justify-start"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                updateDateRange({ start: null, end: null, label: "All Time" })
              }
            >
              All Time
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                updateDateRange({
                  start: startOfToday(),
                  end: new Date(),
                  label: "Today",
                })
              }
            >
              Today
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>By Month</DropdownMenuLabel>
            {monthOptions.map((option) => (
              <DropdownMenuItem
                key={option.label}
                onClick={() => updateDateRange(option)}
                className="flex justify-between cursor-pointer"
              >
                <span
                  className={
                    transactionStats.byMonth[option.label]?.all > 0
                      ? ""
                      : "text-muted-foreground"
                  }
                >
                  {option.label}
                </span>
                <span className="text-muted-foreground">{option.txCount}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Type Filter */}
      {accountAddresses && accountAddresses.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-[140px] flex-row justify-start"
            >
              {direction === "all" ? (
                <div className="flex justify-between w-full items-center">
                  <div className="flex flex-row items-center gap-2">
                    <ArrowLeftRight className="mr-1 h-4 w-4" />
                    All
                  </div>
                  <span className="text-muted-foreground">
                    {dateRange.label === "All Time"
                      ? transactionStats.total.all
                      : transactionStats.byMonth[dateRange.label]?.all}
                  </span>
                </div>
              ) : direction === "inbound" ? (
                <div className="flex justify-between w-full items-center">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Inbound
                  <span className="text-muted-foreground">
                    {dateRange.label === "All Time"
                      ? transactionStats.total.inbound
                      : transactionStats.byMonth[dateRange.label]?.inbound}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between w-full items-center">
                  <ArrowRight className="mr-1 h-4 w-4" />
                  Outbound
                  <span className="text-muted-foreground ml-2">
                    {dateRange.label === "All Time"
                      ? transactionStats.total.outbound
                      : transactionStats.byMonth[dateRange.label]?.outbound}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[120px]">
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDirection("all")}
              className="flex justify-between"
            >
              All
              <span className="text-muted-foreground">
                {dateRange.label === "All Time"
                  ? transactionStats.total.all
                  : transactionStats.byMonth[dateRange.label]?.all || 0}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateType("inbound")}
              className="flex justify-between"
            >
              Inbound
              <span className="text-muted-foreground">
                {dateRange.label === "All Time"
                  ? transactionStats.total.inbound
                  : transactionStats.byMonth[dateRange.label]?.inbound || 0}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateType("outbound")}
              className="flex justify-between"
            >
              Outbound
              <span className="text-muted-foreground">
                {dateRange.label === "All Time"
                  ? transactionStats.total.outbound
                  : transactionStats.byMonth[dateRange.label]?.outbound || 0}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Token Filter */}
      {availableTokens.length > 1 && (
        <>
          <Popover open={tokenSelectOpen} onOpenChange={setTokenSelectOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                {selectedTokens.length === 0
                  ? "All Tokens"
                  : `${selectedTokens.length} selected`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No tokens found.</CommandEmpty>
                  <CommandGroup>
                    {availableTokens.map((token) => (
                      <CommandItem
                        key={token.address}
                        value={`${token.symbol} ${token.address}`}
                        className="cursor-pointer"
                        onSelect={() => {
                          if (selectedTokens.includes(token)) {
                            return updateSelectedTokens(
                              selectedTokens.filter((t) => t !== token)
                            );
                          } else {
                            return updateSelectedTokens([
                              ...selectedTokens,
                              token,
                            ]);
                          }
                          // Keep the popover open
                          setTokenSelectOpen(true);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTokens.includes(token)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {token.symbol}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({token.chain})
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Amount Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-[140px] flex-row justify-start"
          >
            <Coins className="mr-2 h-4 w-4" />
            {getAmountRangeLabel(amountRange)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[140px]">
          <DropdownMenuLabel>Filter by Amount</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => updateAmountRange(undefined)}
          >
            All Amounts
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => updateAmountRange([0, 50])}
          >
            {"< 50"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => updateAmountRange([50, 500])}
          >
            50 - 500
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => updateAmountRange([500, Infinity])}
          >
            500+
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
