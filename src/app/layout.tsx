import type { Metadata } from "next";
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navigation from '@/components/Navigation';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track your daily habits and build better routines",
  openGraph: {
    title: "Habit Tracker",
    description: "Track your daily habits and build better routines",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark' || 
                      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.error('Error applying theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <ThemeProvider>
            <div className="flex h-full">
              <Navigation />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
