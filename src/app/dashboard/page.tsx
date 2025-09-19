'use client';

import { useAppContext } from '@/context/app-context';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import UserDashboard from '@/components/dashboard/user-dashboard';

export default function DashboardPage() {
  const { userRole } = useAppContext();

  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  if (userRole === 'user') {
    return <UserDashboard />;
  }

  return null; // Or a loading skeleton
}
