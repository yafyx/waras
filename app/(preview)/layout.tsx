import type { Metadata } from "next";
import { Providers } from "../providers";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-sdk-preview-rag.vercel.app"),
  title: "Retrieval Augmented Generation Preview",
  description:
    "Augment language model generations with vector based retrieval using the Vercel AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
