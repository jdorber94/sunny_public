import type { Metadata } from "next";
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['800'], // Extra bold weight for the title
});

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <div className={montserrat.className}>
          <Navigation />
          <main className="lg:pl-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
