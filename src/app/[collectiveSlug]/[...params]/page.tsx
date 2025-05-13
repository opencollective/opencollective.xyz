import MonthlySection from "@/components/MonthlySection";
import {
  getTransactionsForCollective,
  getUniqueTokensFromTransactions,
} from "@/lib/transactions";
import { Address, TokenType, TransactionDirection } from "@/types";
import { getCollectiveConfig } from "@/lib/config";

type PageParams = {
  collectiveSlug: string;
  year: string;
  month: string;
  address: string;
};

export default async function CollectivePage({
  params,
  searchParams,
}: {
  params: Promise<{ collectiveSlug: string; params: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const urlParams = await params;
  const queryParams = await searchParams;
  console.log(">>> url params", urlParams);
  console.log(">>> query params", queryParams);
  const collectiveSlug = urlParams.collectiveSlug;
  const pageParams: PageParams = {
    collectiveSlug,
    year: "",
    month: "",
    address: "",
  };

  if (urlParams.params.length > 0) {
    for (const param of urlParams.params) {
      if (param.match(/^0x[a-fA-F0-9]{40}$/)) {
        pageParams.address = param;
      } else if (param.match(/^2[0-1]\d{2}$/)) {
        pageParams.year = param;
      } else if (param.match(/^[0-1]?\d$/)) {
        pageParams.month = param;
      }
    }

    console.log(">>> page params", pageParams);
    const collectiveConfig = getCollectiveConfig(collectiveSlug);

    if (!collectiveConfig) {
      return <div>Collective not found</div>;
    }
    const transactions = await getTransactionsForCollective(
      collectiveSlug,
      pageParams.year ? parseInt(pageParams.year) : undefined,
      pageParams.month ? parseInt(pageParams.month) : undefined
    );

    // Get the oldest transaction timestamp
    const oldestTxTimestamp = Math.min(
      ...transactions.map((tx) => tx.timestamp)
    );
    const oldestTxDate = new Date(oldestTxTimestamp * 1000);

    // Calculate number of months between now and oldest transaction
    const now = new Date();
    const monthDiff =
      (now.getFullYear() - oldestTxDate.getFullYear()) * 12 +
      (now.getMonth() - oldestTxDate.getMonth());

    const pastMonths = Array.from({ length: monthDiff + 1 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        start: date,
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    });

    // Filter transactions by month
    const getMonthTransactions = (start: Date, end: Date) => {
      return transactions.filter((tx) => {
        const txDate = new Date(tx.timestamp * 1000);
        return txDate >= start && txDate <= end;
      });
    };

    const live = pageParams.month
      ? parseInt(pageParams.month) === now.getMonth() + 1
      : false;

    const tokens = getUniqueTokensFromTransactions(transactions);

    return (
      <div className="max-w-screen-lg mx-auto p-4">
        <h1>{collectiveConfig.profile.name}</h1>
        <div>
          {pastMonths
            .filter((month) => {
              if (pageParams.year) {
                if (pageParams.month) {
                  return (
                    month.year === parseInt(pageParams.year) &&
                    month.month === parseInt(pageParams.month) - 1
                  );
                }
                return month.year === parseInt(pageParams.year);
              }
              return true;
            })
            .map((currentMonth, i) => (
              <MonthlySection
                key={currentMonth.label}
                filter={{
                  dateRange: {
                    start: currentMonth.start,
                    end: currentMonth.end,
                    label: currentMonth.label,
                  },
                  selectedTokens: tokens,
                  direction: queryParams.direction as TransactionDirection,
                  tokenType: queryParams.tokenType as TokenType,
                  address: pageParams.address as Address,
                }}
                transactions={getMonthTransactions(
                  currentMonth.start,
                  currentMonth.end
                )}
                limit={
                  queryParams.limit
                    ? parseInt(queryParams.limit as string)
                    : pageParams.month
                    ? 100
                    : 5
                }
                live={live}
                collectiveConfig={collectiveConfig}
              />
            ))}
        </div>
      </div>
    );
  }
}
