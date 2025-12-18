import type { Metadata } from "next";
import "./globals.css";
import { DynamicProvider } from './providers/DynamicProvider';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Dynamic Enterprise Demo | USDC Wallet Integration",
  description: "A comprehensive demo showcasing Dynamic's wallet and authentication capabilities for enterprise applications",
  icons: {
    icon: '/dynamic.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased bg-gray-50" suppressHydrationWarning>
          <DynamicProvider>
            {children}
          </DynamicProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
