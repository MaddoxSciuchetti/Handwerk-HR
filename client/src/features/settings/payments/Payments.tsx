import { Table } from '@/components/ui/selfmade/table/Table';
import { useState } from 'react';
import PaymentMethodModal from './PaymentMethodModal';
import { SubscriptionRow } from './SubscriptionRow';

function Payments() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  return (
    <div className="mx-auto flex h-full flex-col overflow-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex w-200 flex-col items-start">
          <h1 className="typo-h4 font-bold">Zahlungen</h1>
          <p className="typo-body-sm text-muted-foreground">
            Verwalte dein Abo und deine Zahlungsmethoden.
          </p>
        </div>
        <Table className="w-200">
          <SubscriptionRow
            planName="Pro Plan"
            onChangePaymentMethod={() => setIsPaymentModalOpen(true)}
          />
        </Table>
      </div>
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}

export default Payments;
