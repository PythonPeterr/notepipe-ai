import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "Notepipe — AI Meeting Automations",
  description: "Automate your post-meeting CRM workflow with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "bg-white border border-neutral-200 shadow-card text-sm rounded-xl",
          }}
        />
      </body>
    </html>
  );
}
