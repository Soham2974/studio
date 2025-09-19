'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import LoginView from '@/components/auth/login-view';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { userRole, isDataLoaded } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isDataLoaded && userRole) {
      router.replace('/dashboard');
    }
  }, [userRole, isDataLoaded, router]);

  if (!isDataLoaded || userRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return <LoginView />;
}
