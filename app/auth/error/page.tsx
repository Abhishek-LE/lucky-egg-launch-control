"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-4 text-3xl">🔒</div>
        <h1 className="mb-2 text-base font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500">
          {error === "AccessDenied"
            ? "Only @luckyegg.co Google accounts can sign in."
            : "Something went wrong. Please try again."}
        </p>
        <a
          href="/api/auth/signin"
          className="mt-6 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Try again
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
