const GENERIC_BANK_TRANSFER_INSTRUCTION_PATTERNS = [
  "send the transfer using the configured bank details",
  "send the transfer using the bank account configured for this gateway",
  "include the order reference exactly as shown",
  "enrollment is granted after the payment is confirmed",
];

export function splitBankTransferInstructions(value?: string | null) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function hasSpecificBankTransferInstructions(value?: string | null) {
  const normalized = splitBankTransferInstructions(value).join(" ").toLowerCase();

  if (!normalized) return false;

  const genericMatchCount = GENERIC_BANK_TRANSFER_INSTRUCTION_PATTERNS.filter((pattern) =>
    normalized.includes(pattern),
  ).length;
  if (genericMatchCount >= 2) return false;

  return /\b(iban|swift|bic|routing|sort code|account number|account name|bank name|wise|paypal|recipient|beneficiary)\b/i.test(
    normalized,
  );
}
