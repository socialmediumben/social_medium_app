import type { Metadata, Viewport } from "next";
import { Fredoka, Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DevModeProvider } from "@/context/DevModeContext";
import { AppShell } from "@/components/AppShell";

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
  title: "Social Medium App",
  description: "Official web app for Social Medium Makerspace.",
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
      <body className="min-h-full flex flex-col bg-[#f4f4f4] text-stone-800 font-roboto">
        <AuthProvider>
          <DevModeProvider>
            <AppShell>{children}</AppShell>
          </DevModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
