import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSAC Office | Event Planning & Official Documentation System",
  description:
    "Official institutional platform of the Office of the Dean, Student Affairs (KSAC), KIIT Deemed to be University. Society event proposal drafting, budgeting, notesheets, and department requisition management.",
  applicationName: "KSAC Office",
  icons: {
    icon: "/logos/ksac-clean.png",
    apple: "/logos/ksac-clean.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7fbf8] antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
