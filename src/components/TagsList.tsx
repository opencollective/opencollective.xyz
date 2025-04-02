import { Tag } from "@/components/ui/tag";

const tagFilter = (t: string[], kinds?: string[]) =>
  kinds && kinds.length > 0
    ? kinds?.includes(t[0])
    : t[0] === "t" || t[0].length > 1;

export default function TagsList({
  tags,
  kinds,
}: {
  tags: string[][];
  kinds?: string[];
}) {
  if (!tags) return null;
  if (tags.length === 0) return null;
  if (tags.filter((t) => tagFilter(t, kinds)).length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 group relative">
      {tags
        .filter((t) => tagFilter(t, kinds))
        .map((t) => (
          <Tag key={t.join(":")} value={t.join(":")} />
        ))}
    </div>
  );
}
