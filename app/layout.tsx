import type { Metadata, Viewport } from "next";
import { Cinzel, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TopNav } from "@/components/nav/TopNav";
import { Footer } from "@/components/nav/Footer";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seekr — Outdoor Escape Room a Balatonnál",
  description: "Rejtvények, valós helyszínek, csapatkaland a szabadban. Fedezd fel a Balaton titkait!",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Seekr" },
  openGraph: {
    title: "Seekr — Outdoor Escape Room",
    description: "Fedezd fel a város titkait — outdoor kalandjátékok a Balaton partján",
    images: ["/hero.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#131c2e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${cinzel.variable} ${dmSans.variable}`}>
      <body style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <AuthProvider>
          <TopNav />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
