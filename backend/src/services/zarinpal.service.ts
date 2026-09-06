import { config } from "../config/env";

const SANDBOX_BASE = "https://sandbox.zarinpal.com/pg/v4/payment";
const PRODUCTION_BASE = "https://api.zarinpal.com/pg/v4/payment";
const SANDBOX_GATEWAY = "https://sandbox.zarinpal.com/pg/StartPay";
const PRODUCTION_GATEWAY = "https://www.zarinpal.com/pg/StartPay";

function getBaseUrl() {
  return config.zarinpal.sandbox ? SANDBOX_BASE : PRODUCTION_BASE;
}

function getGatewayUrl() {
  return config.zarinpal.sandbox ? SANDBOX_GATEWAY : PRODUCTION_GATEWAY;
}

export function getPaymentGatewayUrl(authority: string): string {
  return `${getGatewayUrl()}/${authority}`;
}

export async function requestPayment(
  amount: number,
  description: string,
  metadata?: { mobile?: string; email?: string }
): Promise<{ authority: string; gatewayUrl: string }> {
  const response = await fetch(`${getBaseUrl()}/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: config.zarinpal.merchantId,
      amount,
      callback_url: config.zarinpal.callbackUrl,
      description,
      metadata,
    }),
  });

  const data = (await response.json()) as {
    data?: { authority?: string; code?: number; message?: string };
    errors?: unknown;
  };

  if (!data.data?.authority || data.data.code !== 100) {
    throw new Error(
      data.data?.message || "خطا در اتصال به درگاه پرداخت"
    );
  }

  return {
    authority: data.data.authority,
    gatewayUrl: getPaymentGatewayUrl(data.data.authority),
  };
}

export async function verifyPayment(
  authority: string,
  amount: number
): Promise<{ refId: string }> {
  const response = await fetch(`${getBaseUrl()}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: config.zarinpal.merchantId,
      amount,
      authority,
    }),
  });

  const data = (await response.json()) as {
    data?: { code?: number; ref_id?: number; message?: string };
  };

  if (data.data?.code !== 100 && data.data?.code !== 101) {
    throw new Error(data.data?.message || "پرداخت تأیید نشد");
  }

  return { refId: String(data.data?.ref_id || "") };
}
