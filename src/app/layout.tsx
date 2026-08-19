import { GoogleOAuthProvider } from "@react-oauth/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Schedoosh",
  description: "Schedoosh: Build your ideal schedule, in a snap. Schedoosh!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "flex max-h-svh min-h-svh flex-col bg-primary/[4%] font-sans antialiased dark:bg-background",
          inter.variable
        )}
      >
        <GoogleOAuthProvider
          clientId={process.env.GOOGLE_CLIENT_ID || "mock-google-client-id"}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
              <Script
                async
                src="https://cloud.umami.is/script.js"
                data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
              />
            )}
            <SpeedInsights />
            <Analytics />
            <Toaster
              richColors
              toastOptions={{
                classNames: {
                  title: "font-sans",
                  description: "font-sans",
                },
              }}
            />
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
