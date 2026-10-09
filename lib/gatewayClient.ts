import {
  obfuscatePayload,
  computeGatewaySignature,
  getClientDeviceFingerprint,
  GATEWAY_OPCODES,
} from "./clientSecurity";

/**
 * Client-Side Dispatcher for the Masked Cryptographic Gateway.
 * All operations pass through /api/gateway using opaque opcodes, scrambled payloads, and integrity signatures.
 */
export async function dispatchGateway<T = any>(
  op: string,
  data: unknown = {}
): Promise<{ ok: boolean; status: number; data?: T; message?: string }> {
  try {
    const nonce = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const ts = Date.now();

    const scrambled = obfuscatePayload(data);
    const sig = computeGatewaySignature(op, scrambled, nonce, ts);

    const res = await fetch("/api/gateway", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KSAC-Integrity": sig,
      },
      body: JSON.stringify({
        op,
        data: scrambled,
        nonce,
        ts,
        sig,
      }),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: resData.message || "Operation failed",
        data: resData,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: resData as T,
    };
  } catch (error: any) {
    console.error("Gateway dispatch error:", error);
    return {
      ok: false,
      status: 500,
      message: error.message || "Network communication error",
    };
  }
}

export { GATEWAY_OPCODES, getClientDeviceFingerprint };
