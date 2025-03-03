import './globals.css';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import Navigation from '@/components/Navigation';
import ClientProviders from '@/components/ClientProviders';
import { generateMetadata as siteMetadata } from './config';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });
const outfit = Outfit({ subsets: ['latin'] });

export const metadata = siteMetadata;

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.className} bg-background dark:bg-background-dark text-text-primary dark:text-text-primary-dark antialiased`}>
        <ClientProviders>
          <div className="min-h-screen flex">
            <Navigation />
            <main className="flex-1 md:pl-20">
              <div className="container mx-auto px-4 py-8">
                {children}
              </div>
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
