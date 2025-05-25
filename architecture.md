# Decentralized Open Collective

## Goal

Create a user friendly interface to manage a collective in a decentralized way.

## Goals

- More community time, less community admin.
- Zero friction, no need to manage private keys (but you can).
- Users should be able to create profiles on behalf of others
- Users should be able to own their data and control their identities (possibility to hand over an account)
- Anyone should be able to easily develop plugins and alternative interfaces
- Make all contributions visible, reward them
- AI agents friendly
- Decentralized storage

## General architecture

We are using Nostr as a simple decentralized backend (signed JSON over relays using websockets).

### Terminology

An Open Collective is a Nostr Channel that anyone can subscribe to.
It can have multiple subchannels (Circles).

The collective has a list of offical members and circles.

Members have devices.

Private keys never leave the device that generated them.

### Create decentralized collective

Publish an event of kind 40 (create channel, [NIP-28](https://github.com/nostr-protocol/nips/blob/master/28.md)) with the following tags:

```json
{
  kind: 40
  "content": "{\"name\": \"Open Letter Collective\", \"about\": \"A collective to manage openletter.earth.\", \"picture\": \"https://openletter.earth/favicon.png\", \"relays\": [\"wss://nos.lol\", \"wss://nostr.mom\"]}",
}
```

### Update collective metadata

```json
{
  kind: 41,
  "content": "{\"name\": \"Updated Demo Channel\", \"about\": \"Updating a test channel.\", \"picture\": \"https://placekitten.com/201/201\", \"relays\": [\"wss://nos.lol\", \"wss://nostr.mom\"]}",
  "tags": [
    ["e", <channel_create_event_id>, <relay-url>, "root"],
    ["t", <tag1>],
    ["t", <tag2>],
    ["t", <tag3>],
  ]
}
```

### Post a message

```json
{
  kind: 42,
  "content": <string>,
  "tags": [["e", <kind_40_event_id>, <relay-url>, "root"]],
  // other fields...
}
```

### Reply to a message

```json
{
  kind: 42,
  "content": <string>,
  "tags": [
      ["e", <kind_40_event_id>, <relay-url>, "root"],
      ["e", <kind_42_event_id>, <relay-url>, "reply"],
      ["p", <reply_to_pubkey>, <relay-url>],
      // rest of tags...
  ],
  // other fields...
}
```

### Post an update

An update is a long form markdown document. It's a replaceable event, meaning that only the latest version is expected to be kept by relays.

The "d" tag is the user defined slug of the post, should be unique for the pubkey of the author.

```json
{
  "kind": 30023, // or 30024 for drafts
  "created_at": 1675642635,
  "content": "Lorem [ipsum][nostr:nevent1qqst8cujky046negxgwwm5ynqwn53t8aqjr6afd8g59nfqwxpdhylpcpzamhxue69uhhyetvv9ujuetcv9khqmr99e3k7mg8arnc9] dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nRead more at nostr:naddr1qqzkjurnw4ksz9thwden5te0wfjkccte9ehx7um5wghx7un8qgs2d90kkcq3nk2jry62dyf50k0h36rhpdtd594my40w9pkal876jxgrqsqqqa28pccpzu.",
  "tags": [
    ["d", "<post_slug, string>"],
    ["title", "Lorem Ipsum"],
    ["published_at", "1296962229"],
    ["t", "placeholder"],
    ["e", "b3e392b11f5d4f28321cedd09303a748acfd0487aea5a7450b3481c60b6e4f87", "wss://relay.example.com"],
    ["a", "30023:a695f6b60119d9521934a691347d9f78e8770b56da16bb255ee286ddf9fda919:ipsum", "wss://relay.nostr.org"]
  ],
  "pubkey": "...",
  "id": "..."
}
```

### React to an event

```json
{
  "kind": 7,
  "content": "✅",
  "tags": [["e", "<event_id>"], ["p", "<event_author_pubkey>"]],
  ...
}
```

### Post an expense

An expense is a proposal to send ["amount", <number>] in ["currency", <string>] to ["p", <profile_event_id>]

```json
{
  kind: 40038,
  "content": <string>,
  "tags": [
    ["e", <kind_40_event_id>, <relay-url>, "root"],
    ["d", <expense_id, number>]
  ],
  // other fields...
}
```

### Post a blockchain transaction

A blockchain transaction is a response to an expense or invoice.

```json
{
  kind: 1111,
  "content": <string>,
  "tags": [
    ["e", <kind_40_event_id>, <relay-url>, "root"],
    ["i", <uri, string>],
    ["d", <expense_id, number>]
    ],
  // other fields...
}
```

### Post a calendar event

```json
{
  "kind": 31923,
  "created_at": 1680000000,
  "pubkey": "npub1...",
  "tags": [
    ["e", <kind_40_event_id>, <relay-url>, "root"],
    ["d", <event_slug, string>],
    ["title", "Community Garden Meetup"],
    ["start", "2025-05-20T18:00:00Z"],
    ["end", "2025-05-20T20:00:00Z"],
    ["location", "Brussels, BE"],
    ["category", "gardening"],
    ["image", "https://example.com/image.png"],
    ["url", "https://example.com/rsvp"]
  ],
  "content": "Join us for an evening of planting and permaculture exchange. Snacks provided.",
  "sig": "..."
}
```