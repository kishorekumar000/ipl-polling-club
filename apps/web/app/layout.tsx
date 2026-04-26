import type { Metadata } from "next";
import { AppRuntime } from "./components/app-runtime";
import { ClubHeader } from "./components/club-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPL Polling Club",
  description: "Daily IPL winner polling with admin settlement control"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClubHeader />
        <AppRuntime />
        {children}
      </body>
    </html>
  );
}
