import { Button } from '@/components/ui/button';

export function RouteError() {
  return (
    <div
      role="alert"
      className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 px-6 text-center"
    >
      <h1 className="text-xl font-semibold">
        Seite konnte nicht geladen werden
      </h1>
      <p className="text-sm text-muted-foreground">
        Bitte lade die Seite neu, um es erneut zu versuchen.
      </p>
      <Button type="button" onClick={() => window.location.reload()}>
        Seite neu laden
      </Button>
    </div>
  );
}
