import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URL to Markdown',
  description: 'Convert any webpage to clean markdown text using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
