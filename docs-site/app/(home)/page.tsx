import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold">Hadox Dokumentation</h1>
      <p className="text-muted-foreground">
        Öffne{' '}
        <Link href="/docs" className="font-medium text-foreground underline">
          /docs
        </Link>{' '}
        für den Einstieg.
      </p>
    </div>
  );
}
