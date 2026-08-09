import type { Metadata } from 'next';
import { Geist, Press_Start_2P } from 'next/font/google';

import './globals.css';

const sans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-loaded',
});

const mono = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-mono-loaded',
});

export const metadata: Metadata = {
  title: {
    default: 'Uhanku Arcade',
    template: '%s | Uhanku Arcade',
  },
  description: 'A Next.js application using the Uhanku arcade design language.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} arcade-root`}>
        {children}
      </body>
    </html>
  );
}
