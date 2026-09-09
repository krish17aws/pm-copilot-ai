import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PM Copilot AI",
  description: "A clarification-first product management copilot for evidence, prioritisation, experiments and product plans.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
