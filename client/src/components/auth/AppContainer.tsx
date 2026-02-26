import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import UserMenu from './UserMenu';
import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/button';

const AppContainer = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  return isLoading ? (
    <div className="w-screen h-[90vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
    </div>
  ) : user ? (
    <div className="p-4 min-h-screen">
      <UserMenu />
      <Outlet />
    </div>
  ) : (
    // insert component for back navigation
    <Button onClick={() => navigate({ to: '/login' })}>Here</Button>
  );
};
export default AppContainer;
