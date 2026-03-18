import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const fredoka = Fredoka({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const nunito = Nunito({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Colourbook — Custom Family Coloring Books',
  description: 'Upload family photos, create beautiful AI-generated coloring pages, and order professionally printed coloring books for your family.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable} antialiased`}>
        {children}
        <Toaster />
        <script
          src="https://ddd-one-tawny.vercel.app/feedback-widget.js"
          data-project="Colourbook"
          data-color="#E85D75"
          defer
        />
      </body>
    </html>
  );
}
