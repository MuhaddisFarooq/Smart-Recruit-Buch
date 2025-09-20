import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import Loader from "@/components/common/Loader";
import { Toaster } from "sonner";
// import { ThemeProvider } from "@/providers/ThemeProvider";
///
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "BINC Portal",
  description: "A Full Fledge Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            {/* <ThemeProvider
             attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            > */}
            <Loader />
            {children}
            {/* </ThemeProvider> */}
          </QueryProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
