import { getTransactionsForCollective } from "@/lib/transactions";
import { getCollectiveConfig } from "@/lib/config";
import { Address } from "@/types";
import { filterTransactions } from "@/lib/utils";
import Leaderboard from "@/components/Leaderboard";

export default async function CollectivePage({
  params,
}: {
  params: Promise<{ collectiveSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1>{collectiveConfig.profile.name}</h1>
      <div>
        <h2>All time activity since {oldestTxDate.toLocaleDateString()}</h2>

        <div>
          <div className="flex flex-col gap-2">
            <Leaderboard
              tokenType="token"
              size="large"
              direction="outbound"
              limit={64}
              transactions={filterTransactions(
                transactions,
                "token",
                "outbound",
                ["0x0000000000000000000000000000000000000000" as Address]
              )}
              className="mt-2 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
