import MonthlySection from "@/components/MonthlySection";
import {
  getTransactionsForCollective,
  getUniqueTokensFromTransactions,
} from "@/lib/transactions";
import { getCollectiveConfig } from "@/lib/config";
export default async function CollectivePage({
  params,
}: {
  params: Promise<{ collectiveSlug: string; year: string }>;
}) {
  const { collectiveSlug, year } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug);

  if (!collectiveConfig) {
    return <div>Collective not found</div>;
  }
  const transactions = await getTransactionsForCollective(collectiveSlug);

  // Get the oldest transaction timestamp
  const oldestTxTimestamp = Math.min(...transactions.map((tx) => tx.timestamp));
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

  const tokens = getUniqueTokensFromTransactions(transactions);

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1>{collectiveConfig.profile.name}</h1>
      <div>
        <h2>Community Activity by Month</h2>
        {pastMonths.map(
          (currentMonth, i) =>
            currentMonth.year === parseInt(year) && (
              <MonthlySection
                key={currentMonth.label}
                label={currentMonth.label}
                tokens={tokens}
                transactions={getMonthTransactions(
                  currentMonth.start,
                  currentMonth.end
                )}
                live={i === 0}
                collectiveConfig={collectiveConfig}
              />
            )
        )}
      </div>
    </div>
  );
}
