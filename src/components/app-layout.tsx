
"use client";

import React from "react";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { WelcomePopup } from "@/components/onboarding/welcome-popup";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 pt-2 px-4 pb-4 md:gap-6 md:pt-2 md:px-6 md:pb-6 lg:gap-8 lg:pt-2 lg:px-8 lg:pb-8 bg-muted/40 pb-20 lg:pb-8">
        {children}
      </main>
      <MobileNavigation />
      <WelcomePopup />
    </div>
  );
};

export default AppLayout;

    