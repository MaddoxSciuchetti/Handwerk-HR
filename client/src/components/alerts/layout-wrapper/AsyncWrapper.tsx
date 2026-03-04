import { USER_PERMISSION as UserPermission } from '@/types/helper.types';
import { ReactNode } from 'react';
import ErrorAlert from '../ErrorAlert';
import LoadingAlert from '../LoadingAlert';
import PermissionDenied from '../PermissionDenied';
import CenteredDiv from './CenteredDiv';

type AsyncWrapperProps = {
  isLoading: boolean;
  isError: boolean;
  userpermission?: UserPermission;
  requiredpermission?: UserPermission;
  children: ReactNode;
  errorMessage?: string;
};

const AsyncWrapper = ({
  isLoading,
  isError,
  userpermission,
  requiredpermission,
  children,
  errorMessage,
}: AsyncWrapperProps) => {
  if (isLoading)
    return (
      <CenteredDiv>
        <LoadingAlert />
      </CenteredDiv>
    );
  if (isError)
    return (
      <CenteredDiv>
        <ErrorAlert message={errorMessage} />
      </CenteredDiv>
    );
  if (userpermission && requiredpermission !== requiredpermission)
    return (
      <CenteredDiv>
        <PermissionDenied />
      </CenteredDiv>
    );

  return <>{children}</>;
};

export default AsyncWrapper;
