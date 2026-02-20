import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Sign in to access the dashboard</h1>
            <SignInButton mode="modal">
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <DashboardClient />
      </SignedIn>
    </>
  );
}
