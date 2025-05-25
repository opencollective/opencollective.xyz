import { getCollectiveConfig } from "@/lib/config";
import CollectivePageContent from "@/components/CollectivePageContent";
import CollectivePageHeader from "@/components/CollectivePageHeader";

export default async function CollectivePage({
  params,
}: {
  params: Promise<{ collectiveSlug: string }>;
}) {
  const { collectiveSlug } = await params;
  const collectiveConfig = getCollectiveConfig(collectiveSlug);

  if (!collectiveConfig) {
    return <div>Collective not found</div>;
  }

  return (
    <div className="max-w-screen-lg mx-auto p-4 space-y-4">
      <CollectivePageHeader collectiveConfig={collectiveConfig} />

      <CollectivePageContent collectiveConfig={collectiveConfig} />
    </div>
  );
}
