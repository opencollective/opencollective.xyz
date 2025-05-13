import MonthlySection from "@/components/MonthlySection";
import {
  getTransactionsForCollective,
  getUniqueTokensFromTransactions,
} from "@/lib/transactions";
import { getCollectiveConfig } from "@/lib/config";
export default async function CollectivePage({
  params,
}: {
  params: Promise<{ collectiveSlug: string }>;
}) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug);
  if (!collectiveConfig) {
    return <div>Collective not found</div>;
  }
  const transactions = await getTransactionsForCollective(collectiveSlug);

  // Get the oldest transaction timestamp
  const oldestTxTimestamp = Math.min(...transactions.map((tx) => tx.timestamp));
  const oldestTxDate = new Date(oldestTxTimestamp * 1000);

  const tokens = getUniqueTokensFromTransactions(transactions);

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1>{collectiveConfig.profile.name}</h1>
      <div>
        <h2>All time activity since {oldestTxDate.toLocaleDateString()}</h2>

        <MonthlySection
          filter={{
            dateRange: {
              start: new Date("2000-01-01"),
              end: new Date(),
              label: "All times",
            },
            selectedTokens: tokens,
          }}
          transactions={transactions}
          live={false}
          collectiveConfig={collectiveConfig}
        />
      </div>
    </div>
  );
}
