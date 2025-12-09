import type { Metadata } from "next";
import "./globals.css";
import { BackgroundAnimation } from "@/components/BackgroundAnimation";

export const metadata: Metadata = {
  title: "Sohojpaat Machine Dashboard",
  description:
    "IoT Dashboard for monitoring and controlling dual motor Sohojpaat machine",
  icons: {
    icon: "/icon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-dark-900">
        <BackgroundAnimation />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
