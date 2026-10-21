import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

describe.each([
  {
    name: 'dialog',
    Root: Dialog,
    Content: DialogContent,
    Title: DialogTitle,
    Trigger: DialogTrigger,
  },
  {
    name: 'sheet',
    Root: Sheet,
    Content: SheetContent,
    Title: SheetTitle,
    Trigger: SheetTrigger,
  },
])('$name opening focus', ({ Root, Content, Title, Trigger }) => {
  it('focuses the container, allows keyboard navigation, and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <Trigger>Open</Trigger>
        <Content aria-describedby={undefined}>
          <Title>Preview</Title>
          <select aria-label="Template">
            <option>Contract</option>
          </select>
          <button>Save</button>
        </Content>
      </Root>
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
