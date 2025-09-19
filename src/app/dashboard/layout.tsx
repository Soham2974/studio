'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import Header from '@/components/layout/header';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, isDataLoaded } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isDataLoaded && userRole === null) {
      router.replace('/');
    }
  }, [userRole, isDataLoaded, router]);

  if (!isDataLoaded || !userRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
