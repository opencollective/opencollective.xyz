import seedrandom from "seedrandom";

// Full set of animal-related emoji (mammals, birds, fish, insects, etc.)
const animalEmojis = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐻‍❄️",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐽",
  "🐸",
  "🐵",
  "🙈",
  "🙉",
  "🙊",
  "🐔",
  "🐧",
  "🐦",
  "🐤",
  "🐣",
  "🐥",
  "🦆",
  "🦅",
  "🦉",
  "🦇",
  "🐺",
  "🐗",
  "🐴",
  "🫎",
  "🫏",
  "🦄",
  "🐝",
  "🪱",
  "🐛",
  "🦋",
  "🐌",
  "🐞",
  "🐜",
  "🪰",
  "🪲",
  "🪳",
  "🦂",
  "🕷️",
  "🕸️",
  "🐢",
  "🐍",
  "🦎",
  "🦖",
  "🦕",
  "🐙",
  "🦑",
  "🦐",
  "🦞",
  "🦀",
  "🪼",
  "🐡",
  "🐠",
  "🐟",
  "🐬",
  "🐳",
  "🐋",
  "🦈",
  "🐊",
  "🐅",
  "🐆",
  "🦓",
  "🦍",
  "🦧",
  "🐘",
  "🦣",
  "🦛",
  "🦏",
  "🐪",
  "🐫",
  "🦒",
  "🦬",
  "🐃",
  "🐂",
  "🐄",
  "🐎",
  "🐖",
  "🐏",
  "🐑",
  "🦙",
  "🐐",
  "🦌",
  "🐕",
  "🐩",
  "🦮",
  "🐕‍🦺",
  "🐈",
  "🐈‍⬛",
  "🪶",
  "🐓",
  "🦃",
  "🦤",
  "🦚",
  "🦜",
  "🪽",
  "🕊️",
  "🐇",
  "🦝",
  "🦨",
  "🦡",
  "🦫",
  "🦦",
  "🦥",
  "🐁",
  "🐀",
  "🐿️",
  "🦔",
];

// Large high-entropy color palette (~100+ distinct, named, visually separated colors)
const colorPalette = [
  "#FF6B6B",
  "#6BCB77",
  "#4D96FF",
  "#FFD93D",
  "#9D4EDD",
  "#FFB5E8",
  "#00C1D4",
  "#F07167",
  "#FF8E72",
  "#9AECDB",
  "#FFC312",
  "#C4E538",
  "#12CBC4",
  "#FDA7DC",
  "#ED4C67",
  "#B53471",
  "#5758BB",
  "#9980FA",
  "#1B9CFC",
  "#3B3B98",
  "#A3CB38",
  "#1289A7",
  "#D980FA",
  "#FDA7DF",
  "#B71540",
  "#F8EFBA",
  "#58B19F",
  "#3DC1D3",
  "#82CCDD",
  "#BDC581",
  "#60A3BC",
  "#E58E26",
  "#0A3D62",
  "#CAD3C8",
  "#3B3B98",
  "#FC427B",
  "#2C3A47",
  "#BDC581",
  "#55E6C1",
  "#2C2C54",
  "#F19066",
  "#B33771",
  "#227093",
  "#33d9b2",
  "#218c74",
  "#706fd3",
  "#34ace0",
  "#ffb142",
  "#ff793f",
  "#f7d794",
  "#778beb",
  "#e77f67",
  "#cf6a87",
  "#574b90",
  "#f3a683",
  "#f8a5c2",
  "#546de5",
  "#e15f41",
  "#c44569",
  "#2bcbba",
  "#0fb9b1",
  "#26de81",
  "#2d98da",
  "#fd9644",
];

// Deterministically pick an item from an array
function pick(rng: () => number, array: string[]) {
  return array[Math.floor(rng() * array.length)];
}

// Pick two distinct colors
function pickTwoColors(rng: () => number, array: string[]) {
  const copy = [...array];
  const first = copy.splice(Math.floor(rng() * copy.length), 1)[0];
  const second = copy.splice(Math.floor(rng() * copy.length), 1)[0];
  return [first, second];
}

function generateAvatar(seed: string) {
  const rng = seedrandom(seed);

  const animal = pick(rng, animalEmojis);
  const [color1, color2] = pickTwoColors(rng, colorPalette);

  const svg = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="90" stroke="url(#ringGradient)" stroke-width="10" fill="transparent"/>
  <text x="53%" y="57%" dominant-baseline="middle" text-anchor="middle" font-size="120">
    ${animal}
  </text>
</svg>
  `.trim();

  return svg;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seed = searchParams.get("seed") || "default-seed";
  const output = generateAvatar(seed);
  return new Response(output, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
