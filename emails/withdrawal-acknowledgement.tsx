type WithdrawalAcknowledgementProps = {
  consumerName: string;
  orderId: string;
  productTitle: string;
  submittedAt: string;
};

export function WithdrawalAcknowledgementEmail({
  consumerName,
  orderId,
  productTitle,
  submittedAt,
}: WithdrawalAcknowledgementProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px", color: "#111827" }}>
      <h1>Withdrawal received</h1>
      <p>{consumerName}, we received your request to withdraw from the contract for {productTitle}.</p>
      <p>Order: {orderId}</p>
      <p>Submitted: {submittedAt}</p>
      <p>Access linked only to this order has been withdrawn. Any refund due will be returned to the original payment method; we will contact you if the payment provider requires manual handling.</p>
      <p>Keep this email as your acknowledgement of the withdrawal request.</p>
    </div>
  );
}
