import { RouterProvider } from '@tanstack/react-router';
import LoadingAlert from './components/alerts/LoadingAlert';
import useAuth from './features/user-profile/hooks/useAuth';
import { router } from './router';
function AppRouter() {
  const { user, isError, isLoading } = useAuth();
  if (isLoading) return <LoadingAlert />;
  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isAuthenticated: !!user && !isError,
          user: user ?? null,
        },
      }}
    />
  );
}
export default AppRouter;
