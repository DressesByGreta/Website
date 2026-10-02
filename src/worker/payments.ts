/**
 * Card payments. No Albanian bank gateway is under contract yet, so production has none and the
 * checkout never offers a card. Locally, CARD_GATEWAY=test enables a simulated bank page so the
 * whole flow (hold stock, pay or decline, confirm or release) can be exercised.
 *
 * A real gateway implements `Gateway`: createPayment returns the bank's hosted payment URL, and a
 * signed callback route marks the order paid (setPaymentStatus + setOrderStatus 'new', then
 * orderAlert for the Telegram message, as /api/pay/test does) or failed.
 */
export interface Gateway {
  id: string;
  createPayment(order: { id: string; number: number; total: number }, origin: string): Promise<{ url: string; ref: string }>;
}

const testGateway: Gateway = {
  id: 'test',
  async createPayment(order, origin) {
    return { url: `${origin}/pagesa/test/${order.id}`, ref: `test_${crypto.randomUUID().slice(0, 12)}` };
  },
};

export function gatewayFor(env: Env): Gateway | null {
  if (import.meta.env.DEV && env.CARD_GATEWAY === 'test') return testGateway;
  return null;
}
