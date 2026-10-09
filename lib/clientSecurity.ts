/**
 * Cryptographic & Obfuscation Utilities for Anti-Reverse Engineering & Network Masking
 */

const PROTOCOL_SIG_SALT = "ksac_rigid_gateway_v2_2026_sig_salt";

/**
 * Fast client/server obfuscator to prevent plain-text schema inspection in DevTools.
 */
export function obfuscatePayload(data: unknown): string {
  try {
    const jsonStr = JSON.stringify(data);
    if (typeof btoa !== "undefined") {
      return btoa(encodeURIComponent(jsonStr));
    }
    return Buffer.from(encodeURIComponent(jsonStr)).toString("base64");
  } catch {
    return "";
  }
}

/**
 * Decodes obfuscated payload safely on the server.
 * Rejects tampered strings, invalid base64, or prototype pollution payloads.
 */
export function deobfuscatePayload<T = any>(encoded: string): T | null {
  try {
    if (typeof encoded !== "string" || !encoded.trim()) {
      return null;
    }
    // Reject strings with invalid base64 characters
    if (!/^[A-Za-z0-9+/=]+$/.test(encoded.trim())) {
      return null;
    }
    let jsonStr: string;
    if (typeof atob !== "undefined") {
      jsonStr = decodeURIComponent(atob(encoded.trim()));
    } else {
      jsonStr = decodeURIComponent(Buffer.from(encoded.trim(), "base64").toString("utf-8"));
    }
    if (jsonStr.includes('"__proto__"') || jsonStr.includes('"constructor"') || jsonStr.includes('"prototype"')) {
      return null;
    }
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Computes a deterministic 128-bit (32-hex char) integrity signature over Gateway envelope fields.
 * Runs identically in both Browser and Node.js environments to detect any payload/header tampering.
 */
export function computeGatewaySignature(
  op: string,
  encodedData: string,
  nonce: string,
  timestamp: number
): string {
  const input = `${PROTOCOL_SIG_SALT}|${op}|${encodedData}|${nonce}|${timestamp}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x9e3779b9 ^ input.length;
  let h4 = 0x85ebca6b ^ input.length;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ (ch << 3), 2246822507);
    h4 = Math.imul(h4 ^ (ch << 5), 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);

  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const p3 = (h3 >>> 0).toString(16).padStart(8, "0");
  const p4 = (h4 >>> 0).toString(16).padStart(8, "0");

  return `${p1}${p2}${p3}${p4}`;
}

/**
 * Verifies the integrity signature of a gateway request.
 */
export function verifyGatewaySignature(
  op: string,
  encodedData: string,
  nonce: string,
  timestamp: number,
  signature: string
): boolean {
  if (typeof signature !== "string" || signature.length !== 32) {
    return false;
  }
  const expected = computeGatewaySignature(op, encodedData, nonce, timestamp);
  return expected === signature;
}

// In-memory Nonce Cache to prevent Replay Attacks
const usedNonces = new Set<string>();

// Cleanup stale nonces every 2 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    usedNonces.clear();
  }, 2 * 60 * 1000);
  if (typeof (timer as any).unref === "function") {
    (timer as any).unref();
  }
}

/**
 * Validates request timestamp and anti-replay nonce.
 * Prevents copied curl/Postman requests from being executed repeatedly.
 */
export function validateGatewayNonce(nonce: string, timestamp: number): { valid: boolean; error?: string } {
  const now = Date.now();
  const MAX_DRIFT_MS = 60 * 1000; // 60 seconds

  if (!nonce || typeof nonce !== "string" || nonce.length < 8 || nonce.length > 128) {
    return { valid: false, error: "Missing or malformed security nonce." };
  }

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp) || Math.abs(now - timestamp) > MAX_DRIFT_MS) {
    return { valid: false, error: "Request timestamp expired or out of sync." };
  }

  if (usedNonces.has(nonce)) {
    return { valid: false, error: "Security nonce already consumed (Replay attack blocked)." };
  }

  usedNonces.add(nonce);
  return { valid: true };
}

/**
 * Standard Opcodes for the unified Gateway
 */
export const GATEWAY_OPCODES = {
  FETCH_STUDENT_DASHBOARD: "0x01",
  REQUEST_GATEPASS: "0x02",
  REQUEST_ROOM_BOOKING: "0x03",
  ACTION_ROOM_BOOKING: "0x04",
  ACTION_PASS_APPROVE: "0x05",
  RECORD_GATE_MOVEMENT: "0x06",
  FETCH_KSAC_REGISTRY: "0x07",
  FETCH_WARDEN_PASSES: "0x08",
  FETCH_KSAC_PASSES: "0x09",
  FETCH_ROOM_SLOTS: "0x0A",
  // Admin & Flow Extension Opcodes
  FETCH_ADMIN_DASHBOARD: "0x0B",
  ADMIN_CREATE_USER: "0x0C",
  ADMIN_UPDATE_USER: "0x0D",
  ADMIN_DELETE_USER: "0x0E",
  ADMIN_DELETE_PASS: "0x0F",
  ADMIN_DELETE_BOOKING: "0x10",
  ADMIN_OVERRIDE_PASS: "0x11",
  ADMIN_OVERRIDE_BOOKING: "0x12",
  // Dean & Attendance Opcodes
  FETCH_DEAN_DASHBOARD: "0x20",
  CREATE_ATTENDANCE_SESSION: "0x21",
  TOGGLE_LOGIN_LOCK: "0x22",
  GENERATE_QR_TOKEN: "0x23",
  SCAN_QR_ATTENDANCE: "0x24",
  CONFIRM_ATTENDANCE: "0x25",
  END_ATTENDANCE_SESSION: "0x26",
  FETCH_ATTENDANCE_STATUS: "0x27",
  // Event Proposal & Department Mailer Opcodes (President / VP / Dean KSAC)
  FETCH_EVENT_PROPOSALS: "0x30",
  SAVE_EVENT_PROPOSAL: "0x31",
  ACTION_EVENT_PROPOSAL: "0x32",
  SEND_DEPARTMENT_EMAILS: "0x33",
  SAVE_DEPARTMENT_CONFIG: "0x34",
  UPLOAD_SIGNED_SOFTCOPY: "0x35",
} as const;

/**
 * Generates or retrieves a persistent client device fingerprint hash for single-device binding.
 * Uses deterministic hardware/browser traits so that normal and incognito tabs on the same
 * browser/device produce an identical fingerprint hash even when storage is partitioned.
 */
export function getClientDeviceFingerprint(): string {
  try {
    if (typeof window !== "undefined") {
      try {
        const existing = window.localStorage?.getItem("ksac_device_fp");
        if (existing && /^[a-zA-Z0-9_-]{8,128}$/.test(existing)) {
          return existing;
        }
      } catch {
        // Ignore storage read errors in strict incognito modes
      }

      const nav = typeof navigator !== "undefined" ? (navigator as any) : {};
      const scr = typeof screen !== "undefined" ? (screen as any) : {};
      const rawTraits = [
        nav.userAgent || "ua",
        nav.language || "en",
        Array.isArray(nav.languages) ? nav.languages.join(",") : "",
        nav.platform || "plat",
        nav.hardwareConcurrency || 0,
        nav.deviceMemory || 0,
        nav.maxTouchPoints || 0,
        scr.width || 0,
        scr.height || 0,
        scr.availWidth || 0,
        scr.availHeight || 0,
        scr.colorDepth || 24,
        typeof window.devicePixelRatio === "number" ? window.devicePixelRatio : 1,
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
      ].join("|");

      let h1 = 0x811c9dc5;
      let h2 = 0xdeadbeef;
      let h3 = 0x9e3779b9;
      let h4 = 0x85ebca6b;
      for (let i = 0; i < rawTraits.length; i++) {
        const c = rawTraits.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 0x01000193);
        h2 = Math.imul(h2 ^ c, 0x5bd1e995);
        h3 = Math.imul(h3 ^ (c << 3), 2246822507);
        h4 = Math.imul(h4 ^ (c << 5), 3266489909);
      }

      const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
      const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
      const p3 = (h3 >>> 0).toString(16).padStart(8, "0");
      const p4 = (h4 >>> 0).toString(16).padStart(8, "0");
      const fp = `dev_${p1}_${p2}_${p3}_${p4}`;

      try {
        window.localStorage?.setItem("ksac_device_fp", fp);
      } catch {
        // Ignore storage write errors in strict incognito modes
      }
      return fp;
    }
  } catch {
    // Fallback if window is unavailable
  }
  return "dev_node_env_fingerprint";
}


