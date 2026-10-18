import useAuth from '@/features/user-profile/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';

export function AdminOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.membershipRole === 'admin';

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate({ to: '/settings/profile' });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading || !isAdmin) return null;
  return children;
}
