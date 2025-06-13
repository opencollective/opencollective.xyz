"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

interface ProductProps {
  product: Product;
}

export default function Product({ product }: ProductProps) {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  // Find monthly and yearly prices
  const monthlyPrice = product.prices?.find((p) => p.frequency === "monthly");
  const yearlyPrice = product.prices?.find((p) => p.frequency === "yearly");

  // Calculate yearly equivalent of monthly price for discount comparison
  const monthlyYearlyEquivalent = monthlyPrice ? monthlyPrice.amount * 12 : 0;
  const yearlyAmount = yearlyPrice?.amount || 0;
  const hasDiscount =
    yearlyPrice && monthlyPrice && yearlyAmount < monthlyYearlyEquivalent;

  // State for selected price (default to first available price)
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(0);
  const selectedPrice = product.prices?.[selectedPriceIndex];
  const singlePrice = product.prices?.length === 1 ? product.prices[0] : null;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold line-clamp-2">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-3">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Multiple Price Options */}
          {product.prices && product.prices.length > 1 && (
            <div className="space-y-2">
              {product.prices.map((price, index) => {
                const isMonthly = price.frequency === "monthly";
                const isYearly = price.frequency === "yearly";
                const showDiscount =
                  price.discount || (isYearly && hasDiscount);

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedPriceIndex(index)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPriceIndex === index
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPriceIndex === index
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedPriceIndex === index && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {price.label ||
                              (price.frequency
                                ? price.frequency.charAt(0).toUpperCase() +
                                  price.frequency.slice(1)
                                : "One-time")}
                          </div>
                          {showDiscount && (
                            <div className="text-xs text-green-600 font-medium">
                              Save{" "}
                              {formatPrice(
                                price.discount ||
                                  monthlyYearlyEquivalent - yearlyAmount,
                                price.currency
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {showDiscount && (
                          <div className="text-sm line-through text-muted-foreground">
                            {formatPrice(
                              price.discount
                                ? price.amount + price.discount
                                : monthlyYearlyEquivalent,
                              price.currency
                            )}
                          </div>
                        )}
                        <div className="font-bold text-primary">
                          {formatPrice(price.amount, price.currency)}
                          {isMonthly && "/mo"}
                          {isYearly && "/yr"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Single Price Display */}
          {singlePrice && (
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(singlePrice.amount, singlePrice.currency)}
                {singlePrice.frequency === "monthly" && "/mo"}
                {singlePrice.frequency === "yearly" && "/yr"}
              </div>
            </div>
          )}

          {(selectedPrice || singlePrice)?.tax &&
            !(selectedPrice || singlePrice)!.tax!.included && (
              <div className="text-xs text-muted-foreground text-center">
                {formatPrice(
                  (selectedPrice || singlePrice)!.tax!.amount,
                  (selectedPrice || singlePrice)!.currency
                )}{" "}
                {(selectedPrice || singlePrice)!.tax!.label} not included
              </div>
            )}
        </div>

        <div className="mt-6">
          {(selectedPrice || singlePrice) && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() =>
                window.open(
                  (selectedPrice || singlePrice)!.stripeLink,
                  "_blank"
                )
              }
            >
              Purchase Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
