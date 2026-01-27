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
  title: 'Power Insight - Take Charge of Your Energy Future',
  description:
    'Understand how data center development impacts your electric bill. Free, open-source tool for individuals and community leaders to evaluate ratepayer impacts.',
  keywords: [
    'data center',
    'electricity costs',
    'ratepayer impact',
    'power insight',
    'electric bill calculator',
    'demand response',
    'grid flexibility',
  ],
  authors: [{ name: 'Power Insight Contributors' }],
  openGraph: {
    title: 'Power Insight - Take Charge of Your Energy Future',
    description: 'Understand how data center development impacts your electric bill',
    type: 'website',
    siteName: 'Power Insight',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Power Insight',
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
