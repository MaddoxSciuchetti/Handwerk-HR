import useAuth from '@/features/user-profile/hooks/useAuth';

function useHasPermission() {
  const { user, isLoading, isError } = useAuth();
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  // const hasPermission = useMemo(() => {
  //   return (requiredPermission: string | undefined) => {
  //     if (!requiredPermission) return true;
  //     // insert correct permission check
  //     if (user?. !== requiredPermission) return false;
  //     return true;
  //   };
  // }, [user?.user_permission]);

  // const accessibleItems = useMemo(() => {
  //   if (!user) return [];
  //   return LAYOUTITEMS.filter((value) =>
  //     // hasPermission(value.requiredPermission)
  //   );
  // }, [hasPermission, user]);

  return {
    user,
    isLoading,
    isError,
    fullName,
    // accessibleItems,
  };
}
export default useHasPermission;
