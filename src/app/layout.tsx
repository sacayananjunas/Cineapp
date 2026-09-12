import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { Providers } from "@/components/providers";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineBook",
  description: "Cinema ticket booking with live seat inventory",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_0%_0%,#fff8e7_0,#f5f7fb_45%,#edf2f7_100%)] text-slate-900">
        <Providers>
          <TopNav />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
