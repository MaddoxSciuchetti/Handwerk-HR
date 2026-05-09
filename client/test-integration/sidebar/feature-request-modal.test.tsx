import ModalOverlay from '@/components/modal/ModalOverlay';
import { SidebarItem } from '@/components/ui/selfmade/sidebaritem';
import {
  CustomSideBarProvider,
  Sidebar,
} from '@/components/ui/sidebar/sidebar';
import FeatureModal from '@/features/sidebar/feature-modal/FeatureModal';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageSquareIcon } from 'lucide-react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithAppQueryClient } from '../test-utils';

const { sendFeatureRequestMock } = vi.hoisted(() => ({
  sendFeatureRequestMock: vi.fn(),
}));

vi.mock('@/apis/index.apis', () => ({
  sendFeatureRequest: (data: unknown) => sendFeatureRequestMock(data),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

function FeedbackSidebarHarness() {
  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen((v) => !v);

  return (
    <CustomSideBarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        className="flex flex-col justify-between rounded-2xl"
      >
        <div />
        <div className="w-full p-2">
          <SidebarItem
            label="Feedback"
            icon={MessageSquareIcon}
            onClick={() => setModalOpen(true)}
          />
        </div>
      </Sidebar>
      {modalOpen && (
        <ModalOverlay handleToggle={toggleModal}>
          <FeatureModal handleToggle={toggleModal} />
        </ModalOverlay>
      )}
    </CustomSideBarProvider>
  );
}

describe('Feature request (Feedback) modal', () => {
  beforeEach(() => {
    sendFeatureRequestMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens from Feedback, submits text, calls the API, then closes', async () => {
    const user = userEvent.setup();
    renderWithAppQueryClient(<FeedbackSidebarHarness />);

    await user.click(screen.getByText('Feedback'));

    expect(
      await screen.findByRole('heading', {
        name: /Was würdest du ändern/i,
      })
    ).toBeInTheDocument();

    const body =
      'Integration: beschreibender Text für den Feature-Request (mind. 5 Zeichen).';
    await user.type(
      screen.getByPlaceholderText(
        /Erzähle uns von deinem Feedback oder deiner Idee/i
      ),
      body
    );

    await user.click(screen.getByRole('button', { name: /^Senden$/i }));

    await waitFor(() => {
      expect(sendFeatureRequestMock).toHaveBeenCalledTimes(1);
    });

    expect(sendFeatureRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        importance: 'Niedrig',
        textarea: body,
      })
    );

    await waitFor(
      () => {
        expect(
          screen.queryByRole('heading', { name: /Was würdest du ändern/i })
        ).not.toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });
});
