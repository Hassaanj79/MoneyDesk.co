import { EmailVerification } from "@/components/auth/email-verification";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <EmailVerification />
    </div>
  );
}
