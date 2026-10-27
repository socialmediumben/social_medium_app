import type { Metadata, Viewport } from "next";
import { Fredoka, Roboto } from "next/font/google";
import "./globals.css";
import { Navbar, BottomNav } from "@/components/Navigation";
import { AuthProvider } from "@/context/AuthContext";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Social Medium Makerspace Companion",
  description: "Official member companion and management web app for Social Medium Makerspace.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f4f4f4] text-stone-800 font-roboto pb-20 md:pb-8">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
