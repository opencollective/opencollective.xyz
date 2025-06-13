"use client";

import type { CollectiveConfig } from "@/types";
import Product from "./Product";

export default function CollectivePageContent({
  collectiveConfig,
}: {
  collectiveConfig: CollectiveConfig;
}) {
  const products = collectiveConfig.products;

  if (!products || products.length === 0) {
    return null;
  }

  const hasMultipleProducts = products.length > 1;

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="mt-4 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">
          Our offerings
        </h2>

        {hasMultipleProducts && (
          <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <span>Swipe to see more</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}

        <div className="relative">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-4" style={{ minWidth: "max-content" }}>
              {products.map((product, index) => (
                <div
                  key={product.name}
                  className="flex-shrink-0 w-64 h-96"
                  style={{
                    // Show partial next card on mobile to hint at scrolling
                    marginRight:
                      index === products.length - 1
                        ? "0"
                        : hasMultipleProducts
                        ? "0"
                        : "0",
                  }}
                >
                  <Product product={product} />
                </div>
              ))}
              {/* Spacer to ensure last card isn't cut off */}
              {hasMultipleProducts && <div className="w-4 flex-shrink-0" />}
            </div>
          </div>

          {/* Fade overlay on the right when there are more cards */}
          {hasMultipleProducts && (
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
