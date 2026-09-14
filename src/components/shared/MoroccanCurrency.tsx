"use client";

import React from "react";
import { useLocale } from "next-intl";
import { formatMAD } from "@/lib/utils";

interface MoroccanCurrencyProps {
  amount: number | string;
  className?: string;
}

export function MoroccanCurrency({ amount, className = "" }: MoroccanCurrencyProps) {
  const locale = useLocale();
  return <span className={className}>{formatMAD(amount, locale)}</span>;
}
