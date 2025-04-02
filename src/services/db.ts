import { Dexie } from "dexie";
import { Event as NostrEvent } from "nostr-tools";
import { Transaction, URI, Address, TxHash } from "@/types";

// Define interfaces for our database tables
interface TransactionRecord extends Transaction {
  id?: number;
  uri: URI;
  chain: string;
  token_address: string;
  tx_hash: TxHash;
  timestamp: number;
  from: Address;
  to: Address;
  value: string;
  block_number: number;
  tx_index: number;
  log_index: number;
}

interface NostrEventRecord {
  id?: number;
  parent_uri: URI; // URI of the parent transaction / address
  event_id: string; // Primary identifier (event.id)
  created_at: number; // Timestamp for sorting
  event: string; // Full event as JSON string
}

class Database extends Dexie {
  transactions!: Dexie.Table<TransactionRecord>;
  nostrEvents!: Dexie.Table<NostrEventRecord>;

  constructor() {
    super("AppDatabase");

    this.version(1).stores({
      transactions:
        "++id, uri, chain, token_address, tx_hash, timestamp, from, to, value, [chain+from], [chain+to], [chain+block_number], tx_index, log_index, block_number",
      nostrEvents:
        "++id, parent_uri, pubkey, event_id, created_at, content, tags",
    });
  }

  // Transaction methods
  async bulkUpsertTransactions(
    transactions: Transaction[],
    chain: string
  ): Promise<void> {
    // Check which transactions already exist
    const existingTxHashes = await this.transactions
      .where("tx_hash")
      .anyOf(transactions.map((tx) => tx.txHash))
      .toArray()
      .then((txs) => new Set(txs.map((tx) => tx.txHash)));

    // Filter out existing transactions
    const newTxs = transactions
      .filter((tx) => !existingTxHashes.has(tx.txHash))
      .map((tx) => ({
        ...tx,
        chain,
      }));

    if (newTxs.length > 0) {
      await this.transactions.bulkAdd(newTxs as TransactionRecord[]);
    }
  }

  async getTransactionsByAddress(
    chain: string,
    address: string
  ): Promise<Transaction[]> {
    const fromTxs = await this.transactions
      .where("[chain+from]")
      .equals([chain, address])
      .toArray();

    const toTxs = await this.transactions
      .where("[chain+to]")
      .equals([chain, address])
      .toArray();

    // Combine, deduplicate, and sort
    const txMap = new Map();
    [...fromTxs, ...toTxs].forEach((tx) => {
      txMap.set(tx.txHash, tx);
    });

    return Array.from(txMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  async getTransactionsByBlockRange(
    chain: string,
    fromBlock: number,
    toBlock: number
  ): Promise<Transaction[]> {
    return await this.transactions
      .where("[chain+blockNumber]")
      .between([chain, fromBlock], [chain, toBlock], true, true)
      .toArray();
  }

  async getTransactionsByTimeRange(
    chain: string,
    address: string,
    startTime: number,
    endTime: number
  ): Promise<Transaction[]> {
    const allTxs = await this.getTransactionsByAddress(chain, address);
    return allTxs.filter(
      (tx) => tx.timestamp >= startTime && tx.timestamp <= endTime
    );
  }

  async getTransactionsByToken(
    chain: string,
    tokenAddress: string
  ): Promise<Transaction[]> {
    return await this.transactions
      .where({ chain: chain, "token.address": tokenAddress })
      .sortBy("timestamp");
  }

  async getLatestBlockNumber(chain: string): Promise<number | null> {
    const tx = await this.transactions
      .where("chain")
      .equals(chain)
      .reverse()
      .sortBy("blockNumber");

    return tx.length > 0 ? tx[0].blockNumber : null;
  }

  // Nostr Event methods
  async addNostrEvent(uri: URI, event: NostrEvent): Promise<void> {
    // Check if event already exists
    const existing = await this.nostrEvents
      .where("event_id")
      .equals(event.id)
      .first();
    // console.log(">>> addNostrEvent: existing", existing, uri, event);
    if (!existing) {
      await this.nostrEvents.add({
        event_id: event.id,
        created_at: event.created_at,
        parent_uri: uri,
        event: JSON.stringify(event),
      });
    }
  }

  async getNostrEvents(): Promise<NostrEvent[]> {
    const events = await this.nostrEvents.toArray();

    return events.map((e) => JSON.parse(e.event));
  }

  async deleteNostrEvent(eventId: string): Promise<void> {
    await this.nostrEvents.where("event_id").equals(eventId).delete();
  }

  async getNostrEventsByURI(uri: URI): Promise<NostrEvent[]> {
    const events = await this.nostrEvents
      .where("parent_uri")
      .equals(uri)
      .toArray();

    return events.map((e) => JSON.parse(e.event));
  }
  async getNostrEventsByURIs(uris: URI[]): Promise<NostrEvent[]> {
    const events = await this.nostrEvents
      .where("parent_uri")
      .anyOf(uris)
      .toArray();

    return events.map((e) => JSON.parse(e.event));
  }

  async getNostrEventsByEventId(eventId: string): Promise<NostrEvent | null> {
    const event = await this.nostrEvents
      .where("event_id")
      .equals(eventId)
      .first();

    return event ? JSON.parse(event.event) : null;
  }
}

let db: Database;

if (typeof window !== "undefined") {
  db = new Database();
}

export { db };
