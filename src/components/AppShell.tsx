'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar, BottomNav } from '@/components/Navigation';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { ChangelogModal } from '@/components/ChangelogModal';
import { CertificationManagerModal } from '@/components/CertificationManagerModal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isKioskDisplay = pathname === '/kiosk-display';

  if (isKioskDisplay) {
    return (
      <main className="fixed inset-0 w-screen h-screen overflow-hidden p-0 m-0 bg-black z-50">
        {children}
      </main>
    );
  }

  return (
    <>
      <ImpersonationBanner />
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-36 md:pb-12">
        {children}
      </main>
      <BottomNav />
      <ChangelogModal />
      <CertificationManagerModal />
    </>
  );
}
