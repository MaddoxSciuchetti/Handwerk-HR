import { RouterProvider } from '@tanstack/react-router';
import useAuth from './features/user-profile/hooks/useAuth';
import { router } from './router';
function AppRouter() {
  const { user, isError, isLoading } = useAuth();
  console.log({ user, isError, isLoading });
  if (isLoading) return <p>hello</p>;
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
