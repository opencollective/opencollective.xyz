import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-4 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[16px] row-start-2 items-center sm:items-start">
        <div className="flex items-center w-full my-4">
          <Image
            className="dark:hidden"
            src="/opencollective-logo.svg"
            alt="open collective logo"
            width={440}
            height={55}
            priority
          />
          <Image
            className="hidden dark:block"
            src="/opencollective-logo-white.svg"
            alt="open collective logo"
            width={440}
            height={55}
            priority
          />
        </div>
        <div className="text-sm/6 sm:text-left font-[family-name:var(--font-geist-mono)]">
          <strong>Open Collective</strong> | ˈōpən kəˈlektiv
          <ul className="list-disc pl-4 max-w-[440px]">
            <li>
              a collective of people working for the community in a transparent
              way
            </li>
            <li>an open source form of organization</li>
          </ul>
        </div>
        <div className="text-sm/6 sm:text-left font-[family-name:var(--font-geist-mono)]">
          <strong>opencollective.xyz</strong> | since 2025
          <ul className="list-disc pl-4 max-w-[440px]">
            <li className="">
              web3 platform to manage financial and non-financial contributions
              for your collective in a transparent way
            </li>
            <li>using stable coins (USDC, EURe, DAI, etc.) and other tokens</li>
          </ul>
        </div>
        <div className="text-sm/6 sm:text-left font-[family-name:var(--font-geist-mono)]">
          <strong>
            <a
              href="https://opencollective.com"
              className="hover:underline hover:underline-offset-4"
            >
              opencollective.com
            </a>
          </strong>{" "}
          | since 2015
          <ul className="list-disc pl-4 max-w-[440px]">
            <li className="">
              web2 platform to receive donations and manage the expenses of your
              collective in a transparent way
            </li>
            <li>using fiat currencies ($, €, £, etc.)</li>
          </ul>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row justify-center text-center w-full">
          {/* <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://github.com/opencollective/opencollective.xyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read me
          </a> */}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="invert-25 hover:invert-0 flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://discord.opencollective.xyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className="dark:invert"
            aria-hidden
            src="/discord.svg"
            alt="discord icon"
            width={16}
            height={16}
          />
          Discord
        </a>
        <a
          className="invert-25 hover:invert-0 flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="nostr:npub1hsr6x2zhw3y6zzndcfel0xwcckkhf05w2ghnulelsppcruq4c3qqzv5whg"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            className="dark:invert"
            src="/nostr.svg"
            alt="Nostr icon"
            width={16}
            height={16}
          />
          Nostr
        </a>
        <a
          className="invert-25 hover:invert-0 flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/opencollective/opencollective.xyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className="dark:invert"
            aria-hidden
            src="/github.svg"
            alt="github icon"
            width={16}
            height={16}
          />
          Github
        </a>
      </footer>
    </div>
  );
}
