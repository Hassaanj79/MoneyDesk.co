"use client";

import { EmailVerificationScreen } from "@/components/auth/email-verification-screen";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [searchParams]);

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Verification link invalid</h1>
          <p className="text-sm text-muted-foreground">Open the link from your email again.</p>
    </div>
      </div>
    );
  }

  return <EmailVerificationScreen email={email} />;
}
