'use client';

import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { userRole, logout } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    router.replace('/');
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-headline text-2xl font-bold text-primary">ComponentShare</h1>
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary md:inline-block">
            {userRole === 'admin' ? 'Admin Portal' : 'Member Portal'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
