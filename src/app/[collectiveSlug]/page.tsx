import { getCollectiveConfig } from "@/lib/config";
import CollectivePageContent from "@/components/CollectivePageContent";
import Image from "next/image";

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
      <div className="flex flex-col gap-3 sm:gap-4 items-center mt-8 sm:mt-8">
        {collectiveConfig.profile?.picture && (
          <Image
            src={collectiveConfig.profile.picture}
            alt={collectiveConfig.profile.name || ""}
            width={100}
            height={100}
            className="rounded-full w-16 h-16 sm:w-24 sm:h-24"
          />
        )}
        <h1 className="text-xl sm:text-3xl font-bold my-0">
          {collectiveConfig.profile.name}
        </h1>
        {collectiveConfig.profile.about && (
          <p
            className="text-sm sm:text-base max-w-96 text-center"
            dangerouslySetInnerHTML={{
              __html:
                collectiveConfig.profile.about?.replace("\n", "<br />") || "",
            }}
          />
        )}
      </div>
      <CollectivePageContent collectiveConfig={collectiveConfig} />
    </div>
  );
}
