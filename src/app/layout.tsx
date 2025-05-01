import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

const quicksand = Quicksand({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "Doge Gov Explorer",
  description: "Explore Doge governance data and savings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={quicksand.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
