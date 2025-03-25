import config from "@/config";
import { getTransactions } from "@/lib/crypto";
import { EtherscanTransfer } from "@/types";

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

  const transactions: EtherscanTransfer[] = [];

  collectiveConfig.wallets.forEach((wallet) => {
    wallet?.tokens?.forEach(async (token) => {
      console.log(token);
      const txs = await getTransactions(
        token.chain,
        token.address,
        wallet.address
      );
      txs.forEach((tx) => {
        transactions.push(tx);
      });
    });
  });

  return <div>{collectiveConfig.name}</div>;
}
