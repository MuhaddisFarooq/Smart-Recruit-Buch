import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import Loader from "@/components/common/Loader";
import { Toaster } from "sonner";

// ✅ add this
import { ConfirmProvider } from "@/components/ui/confirm-provider";

export const metadata: Metadata = {
  title: "Buch Smart Recruiter",
  description: "A Full Fledge Web Application",
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <AuthProvider session={session}>
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
