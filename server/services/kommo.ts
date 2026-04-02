const accessToken = process.env.KOMMO_ACCESS_TOKEN || "";
const subdomain = process.env.KOMMO_SUBDOMAIN || "";

if (!accessToken || !subdomain) {
  throw new Error("Kommo API credentials not configured");
}

const baseUrl = `https://${subdomain}.kommo.com/api/v4`;

/* ------------------------------------------------ */
/* CONFIG RATE LIMIT */
/* ------------------------------------------------ */

const MAX_RPS = 7;
const MAX_CONCURRENT = 3;
const INTERVAL = 1000 / MAX_RPS;
let schedulerRunning = false;
/* ------------------------------------------------ */
/* FILA GLOBAL */
/* ------------------------------------------------ */

type Job = () => Promise<void>;

const queue: Job[] = [];
let activeCount = 0;
let lastRun = 0;

/* ------------------------------------------------ */
/* SCHEDULER */
/* ------------------------------------------------ */

async function schedule() {
  if (schedulerRunning) return;
  schedulerRunning = true;

  while (queue.length && activeCount < MAX_CONCURRENT) {
    const now = Date.now();
    const diff = now - lastRun;

    if (diff < INTERVAL) {
      await new Promise(r => setTimeout(r, INTERVAL - diff));
    }

    const job = queue.shift();
    if (!job) break;

    activeCount++;
    lastRun = Date.now();

    job().finally(() => {
      activeCount--;
      schedule();
    });
  }

  schedulerRunning = false;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        resolve(await fn());
      } catch (err) {
        reject(err);
      }
    });

    schedule();
  });
}

/* ------------------------------------------------ */
/* REQUEST BASE */
/* ------------------------------------------------ */

async function rawRequest(
  endpoint: string,
  options: RequestInit = {},
  retry = 0
): Promise<any> {

  const url = `${baseUrl}${endpoint}`;
  const start = Date.now();

  console.log("➡️ Kommo:", endpoint);

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await res.text();

  console.log("⬅️", res.status, endpoint);

  if (!res.ok) {
    if (res.status === 429 && retry < 5) {
      const wait = 500 * (retry + 1);
      console.warn(`⚠️ Rate limit → retry ${retry + 1} in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      return enqueue(() => rawRequest(endpoint, options, retry + 1));
    }

    throw new Error(`Kommo API error ${res.status}: ${text}`);
  }

  console.log("⏱️", Date.now() - start, "ms");

  return text ? JSON.parse(text) : {};
}

/* ------------------------------------------------ */
/* REQUEST PUBLIC */
/* ------------------------------------------------ */

export function makeRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  return enqueue(() => rawRequest(endpoint, options));
}
