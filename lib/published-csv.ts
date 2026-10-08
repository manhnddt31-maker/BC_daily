import { BULLETIN_CONFIG } from "../config/filters";

type PublishedCsvErrorCode = "SOURCE_UNAVAILABLE" | "SOURCE_SCHEMA_INVALID";

export class PublishedCsvError extends Error {
  constructor(
    public readonly code: PublishedCsvErrorCode,
    public readonly source: string,
    public readonly status: number | null,
    public readonly retryable: boolean,
  ) {
    super(`${source}: ${code}`);
    this.name = "PublishedCsvError";
  }
}

type FetchPublishedCsvOptions = {
  source?: string;
  maxAttempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
};

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429]);

function isRetryableStatus(status: number) {
  return RETRYABLE_HTTP_STATUSES.has(status) || status >= 500;
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell);
  return cells;
}

export async function fetchPublishedCsvRows(
  url: string,
  fetcher: typeof fetch = fetch,
  options: FetchPublishedCsvOptions = {},
): Promise<string[][]> {
  const source = options.source ?? "Google Sheets";
  const maxAttempts = Math.max(1, options.maxAttempts ?? BULLETIN_CONFIG.sourceFetchMaxAttempts);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? BULLETIN_CONFIG.sourceFetchRetryDelayMs);
  const timeoutMs = Math.max(1, options.timeoutMs ?? BULLETIN_CONFIG.sourceFetchTimeoutMs);
  const sleep = options.sleep ?? wait;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let failure: PublishedCsvError;
    try {
      const response = await fetcher(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) {
        return (await response.text()).trim().split(/\r?\n/u).filter(Boolean).map(parseCsvLine);
      }
      failure = new PublishedCsvError(
        "SOURCE_UNAVAILABLE",
        source,
        response.status,
        isRetryableStatus(response.status),
      );
    } catch (error) {
      failure = error instanceof PublishedCsvError
        ? error
        : new PublishedCsvError("SOURCE_UNAVAILABLE", source, null, true);
    }

    if (!failure.retryable || attempt === maxAttempts) throw failure;
    await sleep(retryDelayMs * attempt);
  }

  throw new PublishedCsvError("SOURCE_UNAVAILABLE", source, null, true);
}
