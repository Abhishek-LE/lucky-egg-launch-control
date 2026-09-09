import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Lucky Egg — Launch Control",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen" style={{ backgroundColor: "#f2f1ec" }}>
          <aside
            className="flex w-56 shrink-0 flex-col text-white"
            style={{ backgroundColor: "#14151a" }}
          >
            <div className="px-5 pb-4 pt-6">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Lucky Egg
              </div>
              <div className="text-lg font-black tracking-tight">Launch Control</div>
            </div>
            <nav className="flex-1 space-y-0.5 px-3">
              <Link
                href="/pre-launch"
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Pre-Launch
              </Link>
              <Link
                href="/post-launch"
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Post-Launch
              </Link>
            </nav>
            <div className="border-t border-slate-700 px-5 py-4 text-xs text-slate-500">
              V1 — live on Google Sheets
              <br />
              + Supabase skeleton
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-8 py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
