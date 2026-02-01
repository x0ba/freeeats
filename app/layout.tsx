import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FreeEats - Find Free Food on Campus",
  description: "Crowdsourced free food locations on your college campus. Never miss free pizza again!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FreeEats",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#C4532E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Inline script to detect system theme preference before hydration
// This prevents flash of wrong theme (FOUC) and listens for changes
function ThemeScript() {
  const script = `
    (function() {
      try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const setTheme = (e) => document.documentElement.classList.toggle('dark', e.matches);
        setTheme(mq);
        mq.addEventListener('change', setTheme);
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${fraunces.variable} ${instrumentSans.variable} font-sans antialiased`}
      >
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            {children}
            <Toaster position="top-center" />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
