"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { ExitSurveyForm } from "./exit-survey-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { getAccountDeletionWarning } from "@/services/account-deletion";

export function DeleteAccountForm() {
  const { deleteAccount } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExitSurveyOpen, setIsExitSurveyOpen] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };

  const handleConfirmTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
    setError(null);
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    if (confirmText !== "DELETE") {
      setError("Please type 'DELETE' to confirm");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteAccount(password);
      // User will be automatically logged out and redirected
      router.push("/login");
    } catch (err: any) {
      console.error('Account deletion error:', err);
      if (err.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again.");
      } else if (err.code === 'auth/requires-recent-login') {
        setError("For security reasons, please log out and log back in before deleting your account.");
      } else {
        setError(err.message || "Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleCancelAccount = () => {
    setIsExitSurveyOpen(true);
  };

  const handleProceedWithDeletion = () => {
    setIsExitSurveyOpen(false);
    setIsDialogOpen(true);
  };

  const isFormValid = password && confirmText === "DELETE";

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400 flex items-center">
          <Trash2 className="mr-2 h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Current Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your current password"
              className="border-red-200 dark:border-red-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={handleConfirmTextChange}
              placeholder="Type DELETE to confirm"
              className="border-red-200 dark:border-red-800 font-mono"
            />
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleCancelAccount}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel My Account
            </>
          )}
        </Button>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Final Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-line text-left">
                {getAccountDeletionWarning()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ExitSurveyForm
          isOpen={isExitSurveyOpen}
          onClose={() => setIsExitSurveyOpen(false)}
          onProceedWithDeletion={handleProceedWithDeletion}
        />
      </CardContent>
    </Card>
  );
}
