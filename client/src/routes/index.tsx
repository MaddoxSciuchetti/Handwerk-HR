import { createFileRoute } from '@tanstack/react-router';
import LoginForm from './login';

export const Route = createFileRoute('/')({
  component: LoginForm,
});
