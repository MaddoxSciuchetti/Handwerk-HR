import { Button } from '@/components/ui/button';

export function LoginAction({ isPending }: { isPending: boolean }) {
  return (
    <Button
      variant={'outline'}
      type="submit"
      className="w-full cursor-pointer mt-5"
      disabled={isPending}
    >
      {isPending ? 'Logging in...' : 'Login'}
    </Button>
  );
}
