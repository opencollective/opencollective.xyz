"use client";
import React from "react";

const HumanNumber = ({
  value,
  precision,
}: {
  value: number | string;
  precision?: number;
}) => {
  const locale = typeof window === "undefined" ? "en-US" : navigator.language;
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision || 2,
  }).format(typeof value === "string" ? parseFloat(value) : value);
  return <div>{formattedNumber}</div>;
};

export default HumanNumber;
