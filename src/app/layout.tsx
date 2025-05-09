
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider } from '@/contexts/DataContext';
import { FirebaseErrorDisplay } from '@/components/firebase-error-display'; 

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BizTrack Lite',
  description: 'Manage your small business expenses, cash, and assets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DataProvider>
            {/* FirebaseErrorDisplay must be a child of DataProvider to access its context */}
            <FirebaseErrorDisplay /> 
            {children}
            <Toaster />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
