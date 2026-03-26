import "./globals.css";
import ReduxProvider from "@/components/ReduxProvider";
import AuthGuard from "@/components/AuthGuard";

export const metadata = {
  title: "Connect Fast — AI Chat",
  description: "Lightning-fast multi-provider AI chat engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-ghost font-sans antialiased relative">
        <ReduxProvider>
          <AuthGuard>{children}</AuthGuard>
        </ReduxProvider>
      </body>
    </html>
  );
}
