import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { CalculatorProvider } from '@/hooks/useCalculator';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Community Energy Calculator - Data Center Impact Analysis',
  description:
    'Understand how data center development impacts your electric bill. Free, open-source tool for homeowners and community leaders to evaluate ratepayer benefits.',
  keywords: [
    'data center',
    'electricity costs',
    'ratepayer impact',
    'community energy',
    'electric bill calculator',
    'demand response',
    'grid flexibility',
  ],
  authors: [{ name: 'Community Energy Project' }],
  openGraph: {
    title: 'Community Energy Calculator - Data Center Impact Analysis',
    description: 'Understand how data center development impacts your electric bill',
    type: 'website',
    siteName: 'Community Energy Calculator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Energy Calculator',
    description: 'Understand data center impact on your electric bill',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        <CalculatorProvider>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </CalculatorProvider>
      </body>
    </html>
  );
}
