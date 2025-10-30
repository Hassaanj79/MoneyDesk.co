"use client";

import { useSearchParams } from "next/navigation";

export default function VerifyEmailSentPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center bg-white rounded-lg shadow p-8">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-xl font-semibold mb-2">Please verify your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to <span className="font-medium">{emailParam || "your email"}</span>.
          Open your inbox and click the link to activate your account.
        </p>
        <p className="text-xs text-gray-500 mt-4">If you don't see the email, check your spam folder.</p>
      </div>
    </div>
  );
}




