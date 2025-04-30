import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${quicksand.className} bg-background text-foreground min-h-screen`}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/90">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
