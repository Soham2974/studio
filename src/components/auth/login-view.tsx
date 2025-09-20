'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Shield } from 'lucide-react';

export default function LoginView() {
  const { login } = useAppContext();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<'user' | 'admin' | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('admin');
    
    // Hardcoded credentials to solve deployment issue
    const adminEmail = 'admin@ieee1';
    const adminPassword = 'admin@ieee1!';

    if (email === adminEmail && password === adminPassword) {
      setTimeout(() => {
        login('admin');
        toast({ title: 'Admin login successful', description: 'Welcome, administrator.' });
      }, 500);
    } else {
      setTimeout(() => {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid credentials. Please try again.',
        });
        setIsLoading(null);
      }, 500);
    }
  };

  const handleUserLogin = () => {
    setIsLoading('user');
    setTimeout(() => {
      login('user');
      toast({ title: 'Login successful', description: 'Welcome to the component catalog.' });
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <h1 className="font-headline text-5xl font-bold text-primary">ComponentShare</h1>
        <p className="text-muted-foreground">IEEE Student Chapter Inventory</p>
      </div>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
          <CardHeader className="items-center text-center">
            <User className="mb-2 h-12 w-12 text-primary" />
            <CardTitle className="font-headline text-2xl">Member Access</CardTitle>
            <CardDescription>Browse components and submit requests.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-sm text-muted-foreground">Login for general access.</p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleUserLogin}
              disabled={!!isLoading}
              aria-label="Login as a member"
            >
              {isLoading === 'user' ? 'Logging in...' : 'Login as Member'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
          <CardHeader className="items-center text-center">
            <Shield className="mb-2 h-12 w-12 text-accent" />
            <CardTitle className="font-headline text-2xl">Admin Panel</CardTitle>
            <CardDescription>Manage inventory and user requests.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAdminLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={!!isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!!isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                variant="accent"
                className="w-full"
                disabled={!!isLoading}
                aria-label="Login as an administrator"
              >
                {isLoading === 'admin' ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
