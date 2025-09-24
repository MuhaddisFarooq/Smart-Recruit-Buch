import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import Loader from "@/components/common/Loader";
import { Toaster } from "sonner";

// ✅ add this
import { ConfirmProvider } from "@/components/ui/confirm-provider";

export const metadata: Metadata = {
  title: "Buch Hospital Portal",
  description: "A Full Fledge Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryProvider>
            {/* Provide confirm modal context app-wide */}
            <ConfirmProvider>
              <Loader />
              {children}
            </ConfirmProvider>
          </QueryProvider>
        </AuthProvider>

        {/* Global toast notifications */}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
