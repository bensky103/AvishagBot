import type { Metadata } from "next";
import { Secular_One, Heebo } from "next/font/google";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/ui/Toast";
import { Shell } from "@/components/layout/Shell";
import "./globals.css";

const secularOne = Secular_One({
  weight: "400",
  subsets: ["hebrew", "latin"],
  variable: "--font-secular-one",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "אבישג - ניהול רכש",
  description: "מערכת ניהול רכש",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${secularOne.variable} ${heebo.variable}`}>
      <body className="bg-base font-body">
        <Providers>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
