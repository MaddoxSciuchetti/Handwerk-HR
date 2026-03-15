import { LAYOUTITEMS } from '@/constants/layout.consts';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useMemo } from 'react';

function useHasPermission() {
  const { user } = useAuth();
  const fullName = `${user?.vorname ?? ''} ${user?.nachname ?? ''}`.trim();

  const hasPermission = useMemo(() => {
    return (requiredPermission: string | undefined) => {
      if (!requiredPermission) return true;
      if (user?.user_permission !== requiredPermission) return false;
      return true;
    };
  }, [user?.user_permission]);

  const accessibleItems = useMemo(() => {
    if (!user) return [];
    return LAYOUTITEMS.filter((value) =>
      hasPermission(value.requiredPermission)
    );
  }, [hasPermission, user]);

  return {
    user,
    fullName,
    accessibleItems,
  };
}
export default useHasPermission;
