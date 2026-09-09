import "./globals.css";
import SideNav from "./components/SideNav";

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
            <SideNav />
          </aside>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
