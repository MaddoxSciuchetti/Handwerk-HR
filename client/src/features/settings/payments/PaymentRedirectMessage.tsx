type PaymentRedirectMessageProps = {
  message: string;
};

export function PaymentRedirectMessage({
  message,
}: PaymentRedirectMessageProps) {
  return (
    <section className="flex w-full max-w-md flex-col">
      <p className="typo-body text-card-foreground">{message}</p>
    </section>
  );
}
