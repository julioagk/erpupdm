import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';
import { BalanceProvider } from '@/context/balance-context';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'ERP UPDM',
  description: 'Sistema ERP de control financiero: ventas, compras, banco y contabilidad.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.variable} ${ibmPlexSans.variable}`}>
        <BalanceProvider>
          {children}
        </BalanceProvider>
      </body>
    </html>
  );
}
