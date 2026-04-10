import { getActiveGatewayRecord } from "@/lib/payments/gateway-queries";

export async function getActiveGateway() {
  return getActiveGatewayRecord();
}
