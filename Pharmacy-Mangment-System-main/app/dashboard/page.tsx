'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const role = session?.user?.role;

  // Redirect to role-specific dashboard
  if (role) {
    redirect(`/${role}`);
  }

  return null;
}