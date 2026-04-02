type PurchaseConfirmationProps = {
  courseTitle: string;
  amount: string;
  currency: string;
};

export function PurchaseConfirmationEmail({ courseTitle, amount, currency }: PurchaseConfirmationProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px", color: "#111827" }}>
      <h1>Purchase confirmed</h1>
      <p>You now have access to {courseTitle}.</p>
      <p>
        Charged: {amount} {currency}
      </p>
      <p>Log in to Perseus Platform to begin learning.</p>
    </div>
  );
}
