"use client";

import { OTPVerification } from "@/components/auth/otp-verification";
import { useSearchParams } from "next/navigation";

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || undefined;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OTPVerification 
        mode="verify" 
        email={email}
        onSuccess={() => {
          window.location.href = '/login?verified=true';
        }}
      />
    </div>
  );
}
