import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { Providers } from "./providers";
import { FloatingButton } from "@/components/ui/floating-button";
import { GlobalStyle } from "@/components/riwayat";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://waras.vercel.app"),
  title: "Waras AI",
  description:
    "Augment language model generations with vector based retrieval using the Vercel AI SDK",
  keywords: "AI, SDK, Retrieval, Generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <body>
        <Analytics />
        <Providers>
          <div vaul-drawer-wrapper="" data-vaul-drawer-wrapper="">
            <div className="relative flex min-h-screen flex-col bg-background">
              {children}
              <FloatingButton />
            </div>
          </div>
          <GlobalStyle />
        </Providers>
      </body>
    </html>
  );
}
