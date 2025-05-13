"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  SimplePool,
  type EventTemplate,
  finalizeEvent,
  NostrEvent,
  generateSecretKey,
  getPublicKey,
  VerifiedEvent,
} from "nostr-tools";
import relays from "@/relays.json";
import { decode, nsecEncode, npubEncode } from "nostr-tools/nip19";
import { db } from "@/services/db";
import { insertEventIntoDescendingList } from "nostr-tools/utils";
import { NostrUserBox } from "@/components/NostrUserBox";
import NostrEditProfileModal from "@/components/NostrEditProfileModal";
import type { ProfileData, URI } from "@/types";

export type NostrNote = {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  sig?: string;
  tags: string[][];
};

export type NostrProfile = {
  npub?: string;
  name: string;
  about: string;
  picture: string;
  website: string;
};

type BlockchainKind =
  | "bitcoin:tx"
  | "bitcoin:address"
  | "ethereum:tx"
  | "ethereum:address";

interface NostrContextType {
  pool: SimplePool | null;
  connectedRelays: string[];
  profiles: Record<string, NostrProfile>;
  notesByURI: Record<URI, NostrNote[]>;
  latestNotes: NostrNote[];
  subscribeToNotesByURI: (URIs: URI[]) => void;
  subscribeToLatestNotes: ({
    kinds,
    limit,
  }: {
    kinds: BlockchainKind[];
    limit?: number;
  }) => void;
  subscribeToProfiles: (pubkeys: string[]) => void;
  openEditProfileModal: (uri: URI, profile?: ProfileData) => void;
  updateProfile: ({
    name,
    about,
    picture,
    website,
  }: {
    name: string;
    about: string;
    picture: string;
    website: string;
  }) => Promise<void>;
  publishMetadata: (
    URI: URI,
    { content, tags }: { content: string; tags: string[][] }
  ) => Promise<VerifiedEvent>;
}

const NostrContext = createContext<NostrContextType | null>(null);

export type RelaySubscription = {
  close: () => void;
};

const getItem = (key: string) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
};

const setItem = (key: string, data: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, data);
};

const getURIFromNostrEvent = (event: NostrEvent): URI | undefined => {
  return event.tags.find((t) => t[0] === "I" || t[0] === "i")?.[1] as
    | URI
    | undefined; // TODO: remove "I" (backward compatibility)
};

const getKindFromURI = (uri: URI): string => {
  const type = uri.match(/:tx:/) ? "tx" : "address";
  const blockchain = uri.startsWith("bitcoin") ? "bitcoin" : "ethereum";
  return `${blockchain}:${type}`;
};

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const poolRef = useRef<SimplePool | null>(null);
  const connectedRelaysRef = useRef<string[]>([]);
  const [notesByURI, setNotesByURI] = useState<Record<string, NostrEvent[]>>(
    {}
  ); // Stores kind 1111 events
  const [profiles, setProfiles] = useState<Record<string, NostrProfile>>({});
  const latestNotesSubscriptionRef = useRef<RelaySubscription>(null);
  const notesById = useRef<Record<string, NostrEvent>>({});
  const [latestNotes, setLatestNotes] = useState<NostrEvent[]>([]);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [currentProfileURI, setCurrentProfileURI] = useState<URI | null>(null);
  const [currentProfile, setCurrentProfile] = useState<ProfileData | undefined>(
    undefined
  );
  const subRef = useRef<RelaySubscription[]>([]);
  const profilesSubscriptionsRef = useRef<RelaySubscription | undefined>(null);
  const subscribedURIs = useRef<Record<URI, number>>({});
  const subscribedProfiles = useRef<string[]>([]);

  useEffect(() => {
    const _pool = new SimplePool();

    let nsec = getItem("nostr_nsec");
    let pubkey = getItem("nostr_pubkey");

    if (!nsec) {
      const secretKey = generateSecretKey();
      nsec = nsecEncode(secretKey);
      setItem("nostr_nsec", nsec);
      pubkey = getPublicKey(secretKey);
      setItem("nostr_pubkey", pubkey);
    }
    if (!pubkey) {
      const { data: secretKey } = decode(nsec);
      pubkey = getPublicKey(secretKey as Uint8Array);
      setItem("nostr_pubkey", pubkey);
    }
    const npub = npubEncode(pubkey);
    setItem("nostr_npub", npub);
    if (!npub) {
      throw new Error("useNostr: No npub");
    }

    // Try to connect to each relay independently
    relays.forEach(async (url) => {
      try {
        await _pool.ensureRelay(url, {
          // Add WebSocket options
          connectionTimeout: 3000, // 3 seconds timeout
        });
        console.log(`>>> NostrProvider connected to ${url}`);
        connectedRelaysRef.current.push(url);
      } catch (err) {
        console.warn(`Failed to connect to ${url}:`, err);
        // Continue with other relays even if one fails
      }
    });

    // Set pool even if some relays fail
    poolRef.current = _pool;

    return () => {
      try {
        _pool.close(relays);
      } catch (err) {
        console.warn("Error closing pool:", err);
      }
    };
  }, []);

  const addNostrEventsToState = useCallback((events: NostrEvent[]) => {
    if (!events || events.length === 0) return;

    setLatestNotes((prev) => {
      let next = prev;
      events.forEach((event) => {
        if (notesById.current[event.id]) return;
        notesById.current[event.id] = event;
        next = insertEventIntoDescendingList(next, event);
      });
      return next;
    });

    setNotesByURI((prev) => {
      let hasNewEvents = false;
      const next = { ...prev };

      events.forEach((event) => {
        const uri = getURIFromNostrEvent(event);
        if (!uri) return;

        next[uri] = next[uri] || [];
        // Check if event already exists
        if (!next[uri].some((e) => e.id === event.id)) {
          hasNewEvents = true;
          next[uri] = insertEventIntoDescendingList(next[uri], event);
        }
      });

      // Only return new state if we actually added new events
      return hasNewEvents ? next : prev;
    });
  }, []);

  const subscribeToProfiles = useCallback(
    (pubkeys: string[]) => {
      if (pubkeys.length === 0) return;

      // Close any existing subscription before starting a new one
      if (profilesSubscriptionsRef.current) {
        profilesSubscriptionsRef.current.close();
      }

      const newPubkeys = pubkeys.filter(
        (pk) => !subscribedProfiles.current.some((p) => p === pk)
      );

      if (newPubkeys.length === 0) return;

      // Subscribing to new URIs
      subscribedProfiles.current = [
        ...subscribedProfiles.current,
        ...newPubkeys,
      ];

      profilesSubscriptionsRef.current = poolRef.current?.subscribeMany(
        relays,
        [
          // Get the most recent profile event
          {
            kinds: [0],
            authors: subscribedProfiles.current,
            limit: 1,
          },
          // Also subscribe to new profile updates
          {
            kinds: [0],
            authors: subscribedProfiles.current,
            since: Math.floor(Date.now() / 1000),
          },
        ],
        {
          onevent: (event) => {
            const profile = JSON.parse(event.content) as NostrProfile;
            setProfiles((prev) => ({
              ...prev,
              [event.pubkey]: profile,
            }));
          },
        }
      );
    },
    [poolRef]
  );

  // Get a number between 0 and 20 based on the uri
  const getSubscriptionGroup = (uri: URI) => {
    // Use the last 2 characters of the hash for better distribution
    const hash = uri.split(":").pop() || "";
    const lastTwoChars = hash.slice(-2);
    return parseInt(lastTwoChars, 16) % 10;
  };

  const createNewSubscription = useCallback(
    (uris: URI[], groupIndex: number) => {
      if (!poolRef.current) return;

      if (connectedRelaysRef.current.length === 0) {
        console.log(
          ">>> NostrProvider createNewSubscription: no relays, retrying in 1s"
        );
        setTimeout(() => {
          createNewSubscription(uris, groupIndex);
        }, 1000);
        return;
      }

      if (subRef.current[groupIndex]) {
        subRef.current[groupIndex].close();
      }

      const filter = {
        kinds: [1111], // Listen for kind 1111 notes
        "#i": uris, // Subscribe to multiple #i tags
      };

      subRef.current[groupIndex] = poolRef.current.subscribeMany(
        relays,
        [filter],
        {
          onevent: (event) => {
            // cache event in indexedDB
            const uri = getURIFromNostrEvent(event);
            console.log(">>> NostrProvider event received:", uri, event);
            if (!uri) return;
            addNostrEventsToState([event]);
            db?.addNostrEvent(uri, event);
          },
        }
      ) as RelaySubscription;
    },
    [poolRef, addNostrEventsToState]
  );

  const subscribeToLatestNotes = useCallback(
    ({ kinds, limit }: { kinds: BlockchainKind[]; limit?: number }) => {
      const filter = {
        kinds: [1111], // Listen for kind 1111 notes
        "#k": kinds,
        limit,
      };
      latestNotesSubscriptionRef.current = poolRef.current?.subscribeMany(
        relays,
        [filter],
        {
          onevent: (event) => {
            const uri = getURIFromNostrEvent(event);
            console.log(">>> NostrProvider event received:", uri, event);
            if (!uri) return;
            addNostrEventsToState([event]);
          },
        }
      ) as RelaySubscription;
      return latestNotesSubscriptionRef.current;
    },
    [poolRef, addNostrEventsToState]
  );

  // Subscribe to kind 1111 notes with #i tags
  const subscribeToNotesByURI = useCallback(
    async (URIs: URI[]) => {
      if (URIs.length === 0) return;

      const newURIs: URI[] = [];
      const subscriptionGroupsToUpdate: Set<number> = new Set();
      URIs.forEach((u) => {
        const uri = u.toLowerCase() as URI;
        if (subscribedURIs.current[uri] === undefined) {
          newURIs.push(uri);
          const groupIndex = getSubscriptionGroup(uri);
          console.log(
            ">>> NostrProvider subscribeToNotesByURI: newURI",
            uri,
            "groupIndex",
            groupIndex
          );
          subscribedURIs.current[uri] = getSubscriptionGroup(uri);
          subscriptionGroupsToUpdate.add(subscribedURIs.current[uri]);
        }
      });
      if (newURIs.length === 0) return;

      const cachedEvents = await db?.getNostrEventsByURIs(newURIs);
      if (cachedEvents) {
        addNostrEventsToState(cachedEvents);
      }

      Array.from(subscriptionGroupsToUpdate).forEach((groupIndex) => {
        const groupURIs = Object.keys(subscribedURIs.current).filter(
          (uri: string) => subscribedURIs.current[uri as URI] === groupIndex
        );
        createNewSubscription(groupURIs as URI[], groupIndex);
      });
    },
    [addNostrEventsToState, createNewSubscription]
  );

  const publishEvent = useCallback(
    async (event: EventTemplate, nsec: string) => {
      if (!poolRef.current) throw new Error("Not connected");

      const { data: secretKey } = decode(nsec);
      const signedEvent = finalizeEvent(event, secretKey as Uint8Array);
      console.log(">>> NostrProvider publishEvent: signedEvent", signedEvent);
      await Promise.any(poolRef.current.publish(relays, signedEvent));
      addNostrEventsToState([signedEvent]);
      console.log(
        ">>> NostrProvider publishEvent: signedEvent added to state",
        signedEvent
      );
      return signedEvent;
    },
    [poolRef, addNostrEventsToState]
  );

  const openEditProfileModal = useCallback(
    (uri: URI, profile?: ProfileData) => {
      setCurrentProfile(profile);
      setCurrentProfileURI(uri);
      setEditProfileModalOpen(true);
    },
    []
  );

  const publishMetadata = useCallback(
    async (
      uri: URI,
      { content, tags }: { content: string; tags: string[][] }
    ) => {
      const nsec = getItem("nostr_nsec");
      if (!nsec) throw new Error("Not logged in");

      const event: EventTemplate = {
        kind: 1111,
        created_at: Math.floor(Date.now() / 1000),
        content,
        tags: [
          ["i", uri],
          ["k", getKindFromURI(uri)],
          ...tags.filter((t) => t[0] !== "i" && t[0] !== "k"),
        ],
      };

      const signedEvent = await publishEvent(event, nsec);
      db?.addNostrEvent(uri, signedEvent);
      return signedEvent;
    },
    [publishEvent]
  );

  const updateProfile = useCallback(
    async ({
      name,
      about,
      picture,
      website,
    }: {
      name: string;
      about: string;
      picture: string;
      website: string;
    }) => {
      if (!poolRef.current) throw new Error("Not connected");
      const nsec = getItem("nostr_nsec");
      if (!nsec) throw new Error("Not logged in");

      const { data: secretKey } = decode(nsec);
      const profile = { name, about, picture, website } as NostrProfile;
      const event: EventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        content: JSON.stringify(profile),
        tags: [],
      };
      const signedEvent = finalizeEvent(event, secretKey as Uint8Array);
      setProfiles((prev) => {
        prev[signedEvent.pubkey] = profile;
        return prev;
      });
      await Promise.any(poolRef.current.publish(relays, signedEvent));
    },
    [poolRef]
  );

  // Proceed if at least one relay is connected
  // const isReady = pool && connectedRelays.length > 0;

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      pool: poolRef.current,
      notesByURI,
      latestNotes,
      subscribeToNotesByURI,
      subscribeToLatestNotes,
      subscribeToProfiles,
      profiles,
      updateProfile,
      connectedRelays: connectedRelaysRef.current,
      openEditProfileModal,
      publishMetadata,
    }),
    [
      poolRef.current,
      notesByURI,
      latestNotes,
      subscribeToNotesByURI,
      subscribeToLatestNotes,
      subscribeToProfiles,
      profiles,
      updateProfile,
      openEditProfileModal,
      publishMetadata,
      connectedRelaysRef,
    ] // Include all dependencies
  );

  return (
    <NostrContext.Provider value={contextValue}>
      {children}
      <NostrUserBox />
      {currentProfileURI && (
        <NostrEditProfileModal
          open={editProfileModalOpen}
          uri={currentProfileURI as URI}
          profile={currentProfile}
          onOpenChange={setEditProfileModalOpen}
        />
      )}
    </NostrContext.Provider>
  );
}

export const useProfile = (pubkey?: string) => {
  const context = useContext(NostrContext);
  const nostr_pubkey = pubkey || getItem("nostr_pubkey");

  useEffect(() => {
    if (!context?.pool) return;
    if (!nostr_pubkey) return;
    context.subscribeToProfiles([nostr_pubkey]);
  }, [nostr_pubkey, context]);

  if (!context) {
    throw new Error("useProfile must be used within NostrProvider");
  }
  if (!nostr_pubkey) {
    console.log(">>> useProfile: Not logged in");
    return {
      profile: null,
      updateProfile: context.updateProfile,
    };
  }

  return {
    profile: context.profiles[nostr_pubkey],
    updateProfile: context.updateProfile,
  };
};

export const useProfiles = (pubkeys: string[]) => {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error("useProfiles must be used within NostrProvider");
  }
  context.subscribeToProfiles(pubkeys);
  return { profiles: context.profiles };
};

export const useNotes = (URIs: URI[]) => {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error("useNotes must be used within NostrProvider");
  }
  context.subscribeToNotesByURI(URIs);
  return {
    notes: context.notesByURI,
  };
};

export const useNostr = () => {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error("useNostr must be used within NostrProvider");
  }
  return {
    pool: context.pool,
    connectedRelays: context.connectedRelays,
    updateProfile: context.updateProfile,
    profiles: context.profiles,
    publishMetadata: context.publishMetadata,
    notesByURI: context.notesByURI,
    latestNotes: context.latestNotes,
    subscribeToNotesByURI: context.subscribeToNotesByURI,
    subscribeToLatestNotes: context.subscribeToLatestNotes,
    subscribeToProfiles: context.subscribeToProfiles,
    openEditProfileModal: context.openEditProfileModal,
  };
};
