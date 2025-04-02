import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ArrowLeftRight, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Check, Coins } from "lucide-react";
import type { Address, Token, Transaction } from "@/types/index.d.ts";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfToday } from "date-fns";
import { truncateAddress } from "@/utils/crypto";

type DateRange = {
  start: Date | null;
  end: Date | null;
  label: string;
};

export type Filter = {
  dateRange: DateRange;
  selectedTokens: Token[];
  type: "in" | "out" | "all";
};

export default function Filters({
  availableTokens,
  transactions,
  onChange,
  accountAddress,
}: {
  availableTokens: Token[];
  transactions: Transaction[];
  accountAddress: Address;
  onChange: (filter: Filter) => void;
}) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
    label: "All Time",
  });
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [tokenSelectOpen, setTokenSelectOpen] = useState(false);
  const [type, setType] = useState<"in" | "out" | "all">("all");

  type TransactionStats = {
    byMonth: Record<string, { all: number; in: number; out: number }>;
    byType: Record<string, number>;
    total: { all: number; in: number; out: number };
  };

  const transactionStats = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        const month = format(tx.timestamp * 1000, "MMMM yyyy");
        acc.byMonth[month] = acc.byMonth[month] || { all: 0, in: 0, out: 0 };
        acc.byMonth[month].all++;
        acc.total.all++;
        if (accountAddress) {
          const type = tx.from === accountAddress.toLowerCase() ? "out" : "in";
          acc.byMonth[month][type]++;
          acc.byType[type] = (acc.byType[type] || 0) + 1;
          acc.total[type] = (acc.total[type] || 0) + 1;
        }
        return acc;
      },
      {
        byMonth: {},
        byType: { in: 0, out: 0 },
        total: { all: 0, in: 0, out: 0 },
      } as TransactionStats
    );
  }, [transactions, accountAddress]);

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
          ? transactionStats.byMonth[monthLabel][type]
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
  }, [transactions, transactionStats, type]);

  const updateType = (type: "in" | "out" | "all") => {
    setType(type);
    onChange({ dateRange, selectedTokens, type });
  };

  const updateDateRange = (dateRange: {
    start: Date | null;
    end: Date | null;
    label: string;
  }) => {
    setDateRange(dateRange);
    onChange({ dateRange, selectedTokens, type });
  };

  const updateSelectedTokens = (selectedTokens: Token[]) => {
    setSelectedTokens(selectedTokens);
    onChange({ dateRange, selectedTokens, type });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Filter */}
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

      {/* Type Filter */}
      {accountAddress && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-[140px] flex-row justify-start"
            >
              {type === "all" ? (
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
              ) : type === "in" ? (
                <div className="flex justify-between w-full items-center">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Inbound
                  <span className="text-muted-foreground">
                    {dateRange.label === "All Time"
                      ? transactionStats.total.in
                      : transactionStats.byMonth[dateRange.label]?.in}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between w-full items-center">
                  <ArrowRight className="mr-1 h-4 w-4" />
                  Outbound
                  <span className="text-muted-foreground ml-2">
                    {dateRange.label === "All Time"
                      ? transactionStats.total.out
                      : transactionStats.byMonth[dateRange.label]?.out}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[120px]">
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setType("all")}
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
              onClick={() => updateType("in")}
              className="flex justify-between"
            >
              Inbound
              <span className="text-muted-foreground">
                {dateRange.label === "All Time"
                  ? transactionStats.total.in
                  : transactionStats.byMonth[dateRange.label]?.in || 0}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateType("out")}
              className="flex justify-between"
            >
              Outbound
              <span className="text-muted-foreground">
                {dateRange.label === "All Time"
                  ? transactionStats.total.out
                  : transactionStats.byMonth[dateRange.label]?.out || 0}
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
                <CommandInput placeholder="Search tokens..." />
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
                          ({truncateAddress(token.address)})
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
    </div>
  );
}
