import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GreetingHeader from '@/features/worker-lifecycle/components/GreetingHeader';

describe('GreetingHeader', () => {
  it('renders the loading placeholder without nesting a div inside a paragraph', () => {
    const { container } = render(<GreetingHeader firstname="" isLoading />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton?.closest('p')).toBeNull();
  });

  it('greets the user after loading', () => {
    render(<GreetingHeader firstname="Ada" />);
    expect(screen.getByText('Hallo, Ada')).toBeInTheDocument();
  });
});
