import { NostrNote } from "@/providers/NostrProvider";

export default function TagValue({
  note,
  kind,
}: {
  note: NostrNote;
  kind: string;
}) {
  if (!note || !note.tags) return null;
  for (const tag of note.tags) {
    if (tag[0] === kind) {
      return tag[1];
    }
  }
  return null;
}
