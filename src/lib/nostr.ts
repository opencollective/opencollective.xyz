import { SimplePool, NostrEvent } from "nostr-tools";
import relays from "@/relays.json";
import type { URI } from "@/types";

export type NostrNote = {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  sig?: string;
  tags: string[][];
};

let pool: SimplePool | null = null;
let connectedRelays: string[] = [];

export const getURIFromNostrEvent = (event: NostrEvent): URI | undefined => {
  return event.tags.find((t) => t[0] === "I" || t[0] === "i")?.[1] as
    | URI
    | undefined; // TODO: remove "I" (backward compatibility)
};

/**
 * Initialize connection to Nostr relays
 */
export async function initializeNostrConnection(): Promise<void> {
  if (pool) return; // Already initialized

  pool = new SimplePool();
  connectedRelays = [];

  // Try to connect to each relay independently
  const connectionPromises = relays.map(async (url) => {
    try {
      await pool!.ensureRelay(url, {
        connectionTimeout: 3000,
      });
      console.log(`Connected to Nostr relay: ${url}`);
      connectedRelays.push(url);
      return url;
    } catch (err) {
      console.warn(`Failed to connect to ${url}:`, err);
      return null;
    }
  });

  await Promise.allSettled(connectionPromises);

  if (connectedRelays.length === 0) {
    throw new Error("Failed to connect to any Nostr relays");
  }

  console.log(
    `Successfully connected to ${connectedRelays.length}/${relays.length} Nostr relays`
  );
}

/**
 * Subscribe to notes by URI and return them
 * @param URIs - Array of URIs to subscribe to
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise<NostrNote[]> - Array of notes found for the given URIs
 */
export async function subscribeToNotesByURI(
  URIs: URI[],
  timeout = 5000
): Promise<NostrNote[]> {
  if (!pool) {
    await initializeNostrConnection();
  }

  if (!pool || connectedRelays.length === 0) {
    throw new Error("No Nostr connection available");
  }

  if (URIs.length === 0) {
    return [];
  }

  return new Promise((resolve) => {
    const notes: NostrNote[] = [];
    const seenIds = new Set<string>();

    const filter = {
      kinds: [1111], // Listen for kind 1111 notes
      "#i": URIs, // Subscribe to multiple #i tags
    };

    const subscription = pool!.subscribeMany(connectedRelays, [filter], {
      onevent: (event: NostrEvent) => {
        const uri = getURIFromNostrEvent(event);
        if (!uri || !URIs.includes(uri)) return;

        // Avoid duplicates
        if (seenIds.has(event.id)) return;
        seenIds.add(event.id);

        const note: NostrNote = {
          id: event.id,
          content: event.content,
          created_at: event.created_at,
          pubkey: event.pubkey,
          sig: event.sig,
          tags: event.tags,
        };

        notes.push(note);
      },
      oneose: () => {
        // End of stored events reached
        subscription.close();
        resolve(notes.sort((a, b) => b.created_at - a.created_at)); // Sort by newest first
      },
    });

    // Set a timeout to close the subscription and return what we have
    setTimeout(() => {
      subscription.close();
      resolve(notes.sort((a, b) => b.created_at - a.created_at));
    }, timeout);
  });
}

/**
 * Get latest notes by blockchain kind
 * @param kinds - Array of blockchain kinds to filter by
 * @param limit - Maximum number of notes to return
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise<NostrNote[]> - Array of latest notes
 */
export async function getLatestNotes(
  kinds: string[] = [],
  limit = 50,
  timeout = 5000
): Promise<NostrNote[]> {
  if (!pool) {
    await initializeNostrConnection();
  }

  if (!pool || connectedRelays.length === 0) {
    throw new Error("No Nostr connection available");
  }

  return new Promise((resolve) => {
    const notes: NostrNote[] = [];
    const seenIds = new Set<string>();

    const filter: {
      kinds: number[];
      limit: number;
      "#k"?: string[];
    } = {
      kinds: [1111],
      limit,
    };

    if (kinds.length > 0) {
      filter["#k"] = kinds;
    }

    const subscription = pool!.subscribeMany(connectedRelays, [filter], {
      onevent: (event: NostrEvent) => {
        // Avoid duplicates
        if (seenIds.has(event.id)) return;
        seenIds.add(event.id);

        const note: NostrNote = {
          id: event.id,
          content: event.content,
          created_at: event.created_at,
          pubkey: event.pubkey,
          sig: event.sig,
          tags: event.tags,
        };

        notes.push(note);
      },
      oneose: () => {
        subscription.close();
        resolve(notes.sort((a, b) => b.created_at - a.created_at));
      },
    });

    setTimeout(() => {
      subscription.close();
      resolve(notes.sort((a, b) => b.created_at - a.created_at));
    }, timeout);
  });
}

/**
 * Close Nostr connection and cleanup
 */
export function closeNostrConnection(): void {
  if (pool) {
    try {
      pool.close(relays);
    } catch (err) {
      console.warn("Error closing Nostr pool:", err);
    }
    pool = null;
    connectedRelays = [];
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  connectedRelays: string[];
  totalRelays: number;
} {
  return {
    isConnected: pool !== null && connectedRelays.length > 0,
    connectedRelays: [...connectedRelays],
    totalRelays: relays.length,
  };
}
