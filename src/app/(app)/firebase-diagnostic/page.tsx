import { FirebaseDiagnostic } from '@/components/debug/firebase-diagnostic';

export default function FirebaseDiagnosticPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Diagnostic</h1>
      <FirebaseDiagnostic />
    </div>
  );
}
