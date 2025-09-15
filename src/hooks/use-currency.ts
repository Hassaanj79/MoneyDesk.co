
"use client";

import { useCurrencyContext } from "@/contexts/currency-context";

export const useCurrency = () => {
  const context = useCurrencyContext();
  return context;
};
