import { Skeleton } from '@/components/ui/skeleton';

type GreetingHeaderProps = {
  firstname: string;
  isLoading?: boolean;
};
const GreetingHeader = ({ firstname, isLoading }: GreetingHeaderProps) => {
  return (
    <>
      <div className="flex pb-5 ">
        <div className="typo-h5 text-foreground">
          Hallo,{' '}
          {isLoading ? (
            <Skeleton className="inline-block h-6 w-28 align-middle" />
          ) : (
            firstname
          )}
        </div>
      </div>
    </>
  );
};

export default GreetingHeader;
