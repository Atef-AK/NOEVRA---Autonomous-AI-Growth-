import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GrowthOS — Autonomous AI Growth Department',
    template: '%s | GrowthOS',
  },
  description:
    'GrowthOS is an autonomous AI growth operating system that works as your full-stack growth department — SEO, content, analytics, ads, community, and more.',
  keywords: ['AI', 'growth', 'marketing', 'SEO', 'automation', 'SaaS'],
  authors: [{ name: 'GrowthOS' }],
  openGraph: {
    type: 'website',
    title: 'GrowthOS',
    description: 'Your autonomous AI growth department',
    siteName: 'GrowthOS',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050510',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
