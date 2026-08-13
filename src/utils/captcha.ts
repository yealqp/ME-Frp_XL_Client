/**
 * 自实现 Cap.js PoW 验证码求解器
 *
 * 零外部依赖，零原生库。算法:
 *   1. FNV-1a PRNG 生成 salt + target
 *   2. SHA-256(salt + nonce) 碰撞求解 (Web Crypto API)
 *   3. 提交 nonce 数组换 token
 */

const CAP_BASE_URL = "https://captcha.mefrp.com";
const CAP_SITE_ID = "2bf50e050d";

// 挑战参数安全上限：防止异常/恶意服务端返回超大 count 导致客户端 CPU 耗尽
const MAX_CHALLENGE_COUNT = 50;
const MAX_SALT_LENGTH = 128;
const MAX_DIFFICULTY = 16;

// 网络请求超时（毫秒），避免 challenge/redeem 挂起时验证永久 pending
const CAPTCHA_FETCH_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CAPTCHA_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── FNV-1a 伪随机数生成器 ──

function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function prng(seed: string, length: number): string {
  let state = fnv1a(seed);
  let result = "";

  function next(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  }

  while (result.length < length) {
    result += next().toString(16).padStart(8, "0");
  }

  return result.substring(0, length);
}

// ── SHA-256 PoW 求解（Web Crypto API） ──

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function solveSingleChallenge(
  token: string,
  index: number,
  saltLength: number,
  difficulty: number,
): Promise<number> {
  const salt = prng(`${token}${index}`, saltLength);
  const target = prng(`${token}${index}d`, difficulty);
  let nonce = 0;

  while (true) {
    const hash = await sha256Hex(salt + nonce);

    if (hash.startsWith(target)) {
      return nonce;
    }

    nonce++;

    if (nonce > 50_000_000) {
      throw new Error(
        `PoW 求解超限 (idx=${index}, target=${target}, salt=${salt.substring(0, 8)}...)`,
      );
    }
  }
}

// ── HTTP 交互 ──

interface ChallengeResponse {
  token: string;
  count: number;
  saltLength: number;
  difficulty: number;
}

async function fetchCapChallenge(apiEndpoint: string): Promise<ChallengeResponse> {
  const response = await fetchWithTimeout(`${apiEndpoint}challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  if (!response.ok) {
    let body = "";
    try { body = await response.text(); } catch { /* ignore */ }
    throw new Error(
      `获取挑战失败: HTTP ${response.status} | 响应体: ${body.substring(0, 1000)}`,
    );
  }

  const rawText = await response.text();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    throw new Error(
      `挑战接口返回非 JSON | 响应体: ${rawText.substring(0, 1000)}`,
    );
  }

  const root = ((payload.data || payload) ?? {}) as Record<string, unknown>;
  const token = root.token as string | undefined;
  const challenge = root.challenge as Record<string, unknown> | undefined;

  if (!token || typeof challenge !== "object") {
    throw new Error(
      `挑战接口缺少 token/challenge | 完整响应: ${rawText.substring(0, 1000)}`,
    );
  }

  const count = Number(challenge.c);
  const saltLength = Number(challenge.s);
  const difficulty = Number(challenge.d);

  if (!Number.isFinite(count) || !Number.isFinite(saltLength) || !Number.isFinite(difficulty)) {
    throw new Error(
      `挑战参数解析失败: c=${challenge.c} s=${challenge.s} d=${challenge.d} | ${rawText.substring(0, 1000)}`,
    );
  }

  // 安全上限校验：防止超大 count / 难度导致 CPU 耗尽或长时间阻塞
  if (
    count <= 0 ||
    count > MAX_CHALLENGE_COUNT ||
    saltLength <= 0 ||
    saltLength > MAX_SALT_LENGTH ||
    difficulty <= 0 ||
    difficulty > MAX_DIFFICULTY
  ) {
    throw new Error(
      `挑战参数超出安全范围: count=${count} saltLength=${saltLength} difficulty=${difficulty}`,
    );
  }

  return { token, count, saltLength, difficulty };
}

async function redeemCapSolution(
  apiEndpoint: string,
  token: string,
  solutions: number[],
): Promise<string> {
  const body = JSON.stringify({ token, solutions });
  const response = await fetchWithTimeout(`${apiEndpoint}redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  let responseBody: string;
  try {
    responseBody = await response.text();
  } catch {
    responseBody = "<unable to read body>";
  }

  if (!response.ok) {
    throw new Error(
      `提交解答失败: HTTP ${response.status} | 响应体: ${(responseBody || "<空>").substring(0, 1000)}`,
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(responseBody) as Record<string, unknown>;
  } catch {
    throw new Error(
      `解析响应 JSON 失败 (HTTP 200) | 响应体: ${(responseBody || "<空>").substring(0, 1000)}`,
    );
  }

  const root = (payload.data || payload) as Record<string, unknown>;

  if (root.success === false) {
    throw new Error(`服务端拒绝: ${String(root.message || "unknown")}`);
  }

  if (!root.token) {
    throw new Error("服务端未返回 token");
  }

  return String(root.token);
}

// ── 公开 API ──

interface CaptchaOptions {
  siteId?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

interface CaptchaInstance {
  verify: () => Promise<string>;
  reset: () => void;
  getToken: () => string | null;
  destroy: () => void;
  isInitialized: () => boolean;
}

export function createCaptcha(options: CaptchaOptions = {}): CaptchaInstance {
  const { siteId = CAP_SITE_ID, onProgress, onError } = options;
  const endpoint = `${CAP_BASE_URL}/${siteId}/`;

  let solvedToken: string | null = null;
  let destroyed = false;

  const verify = async (): Promise<string> => {
    if (solvedToken) return solvedToken;
    if (destroyed) throw new Error("验证实例已销毁");

    try {
      onProgress?.(10);

      // 1. 获取挑战
      const challenge = await fetchCapChallenge(endpoint);
      onProgress?.(30);

      const { token, count, saltLength, difficulty } = challenge;

      // 2. 逐题求解（每道题前检查是否已销毁，支持中断）
      const solutions: number[] = [];
      for (let i = 1; i <= count; i++) {
        if (destroyed) {
          throw new Error("验证已取消");
        }
        const nonce = await solveSingleChallenge(token, i, saltLength, difficulty);
        solutions.push(nonce);
        onProgress?.(30 + Math.round((i / count) * 40));
      }

      if (solutions.length === 0) {
        throw new Error("求解器未产生任何 nonce");
      }

      onProgress?.(70);

      // 3. 提交解答
      const resultToken = await redeemCapSolution(endpoint, token, solutions);
      onProgress?.(100);

      solvedToken = resultToken;
      return resultToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "验证失败";
      onError?.(errorMessage);
      throw error;
    }
  };

  const reset = (): void => {
    solvedToken = null;
  };

  const getToken = (): string | null => solvedToken;

  const destroy = (): void => {
    destroyed = true;
    solvedToken = null;
  };

  const isInitialized = (): boolean => !destroyed;

  return {
    verify,
    reset,
    getToken,
    destroy,
    isInitialized,
  };
}
