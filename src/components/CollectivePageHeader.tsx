import { CollectiveConfig } from "@/types";
import Image from "next/image";

export default function CollectivePageHeader({
  collectiveConfig,
}: {
  collectiveConfig: CollectiveConfig;
}) {
  return (
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
  );
}
