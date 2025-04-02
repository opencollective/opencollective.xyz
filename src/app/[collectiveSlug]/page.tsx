import ExpenseTracker from "@/components/ExpenseTracker";
import TransactionsList from "@/components/TransactionsList";
import config from "@/config.json";
import { getTransactions } from "@/lib/crypto";
import { NostrProvider } from "@/providers/NostrProvider";
import {
  EtherscanTransfer,
  Token,
  Transaction,
  WalletConfig,
  Address,
} from "@/types";
import chains from "@/chains.json";
export default async function CollectivePage({
  params,
}: {
  params: Promise<{ collectiveSlug: string }>;
}) {
  const { collectiveSlug } = await params;
  const collectiveConfig = config.collectives.find(
    (collective) => collective.slug === collectiveSlug
  );

  if (!collectiveConfig) {
    return <div>Collective not found</div>;
  }

  const transactions: Transaction[] = [];

  const addTransactions = (txs: EtherscanTransfer[], token: Token) => {
    txs.forEach((tx) => {
      transactions.push({
        blockNumber: tx.blockNumber,
        chainId: chains[token.chain as keyof typeof chains].id,
        txHash: tx.hash,
        timestamp: tx.timeStamp,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        token: token,
      });
    });
  };

  let openCollectiveSlug = null;

  await Promise.all(
    collectiveConfig.tokens?.map(async (token) => {
      const txs = await getTransactions(token.chain, token.address as Address);
      addTransactions(txs, token as Token);
    }) || []
  );
  // Wait for all wallet processing to complete
  await Promise.all(
    (collectiveConfig.wallets as WalletConfig[]).map(async (wallet) => {
      if (wallet.type === "opencollective") {
        console.log(wallet);
        openCollectiveSlug = wallet.collectiveSlug;
      }
      if (wallet.type === "blockchain") {
        // Wait for all token processing within each wallet
        await Promise.all(
          wallet.tokens?.map(async (token) => {
            if (!token.symbol) {
              return [];
            }
            console.log(token);
            const txs = await getTransactions(
              token.chain,
              token.address,
              wallet.address.split("/")[0]
            );
            addTransactions(txs, token);
            return txs;
          }) || []
        );
        // Flatten and add all transactions
      }
    })
  );

  transactions.sort((a, b) => b.timestamp - a.timestamp);
  console.log(transactions);

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <h1>{collectiveConfig.name}</h1>
      <div>
        <h2>Expenses</h2>
        {openCollectiveSlug && (
          <ExpenseTracker
            collectiveSlug={openCollectiveSlug}
            limit={5}
            showStatus={true}
          />
        )}
      </div>
      <div>
        <h2>Latest transactions</h2>
        <div>
          <NostrProvider>
            <TransactionsList transactions={transactions} />
          </NostrProvider>
        </div>
      </div>
    </div>
  );
}
