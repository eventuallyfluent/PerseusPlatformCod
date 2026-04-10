import { decryptGatewayCredentialValue } from "@/lib/payments/gateway-credentials";

export function getGatewayCredentialMap(
  credentials: Array<{
    key: string;
    valueEncrypted: string;
  }>,
) {
  return Object.fromEntries(
    credentials.map((credential) => {
      try {
        return [credential.key, decryptGatewayCredentialValue(credential.valueEncrypted) ?? ""];
      } catch {
        return [credential.key, ""];
      }
    }),
  );
}
