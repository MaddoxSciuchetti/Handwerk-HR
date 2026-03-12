import HomePage from '@/features/home-page/components/HomePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/home')({
  component: HomePage,
});

export default function Home() {
  return <HomePage />;
}
