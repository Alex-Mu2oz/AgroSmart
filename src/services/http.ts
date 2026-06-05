import { err, ok, type Result } from '@core/result';

/**
 * Cliente HTTP con AbortController (timeout), reintentos con backoff y errores
 * tipados. Nunca lanza a la UI: devuelve `Result`.
 */

export type HttpErrorTipo = 'timeout' | 'offline' | 'http' | 'parse';

export interface HttpError {
  tipo: HttpErrorTipo;
  status?: number;
  detalle?: string;
}

export interface HttpOpts {
  timeoutMs: number;
  /** Reintentos solo en timeout / 5xx / red (nunca 4xx). */
  retries?: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function getJson<T>(url: string, opts: HttpOpts): Promise<Result<T, HttpError>> {
  const retries = opts.retries ?? 0;
  let intento = 0;

   
  while (true) {
    const r = await intentarGet<T>(url, opts.timeoutMs);
    if (r.ok) return r;

    const reintentable = r.error.tipo === 'timeout' || r.error.tipo === 'offline' || (r.error.tipo === 'http' && (r.error.status ?? 0) >= 500);
    if (!reintentable || intento >= retries) return r;

    // backoff exponencial + jitter
    const base = 300 * 2 ** intento;
    await sleep(base + Math.floor((intento + 1) * 137) % 200);
    intento += 1;
  }
}

async function intentarGet<T>(url: string, timeoutMs: number): Promise<Result<T, HttpError>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return err({ tipo: 'http', status: res.status, detalle: `HTTP ${res.status}` });
    }
    try {
      const data = (await res.json()) as T;
      return ok(data);
    } catch (e) {
      return err({ tipo: 'parse', detalle: String(e) });
    }
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === 'AbortError') return err({ tipo: 'timeout' });
    return err({ tipo: 'offline', detalle: String(e) });
  } finally {
    clearTimeout(timer);
  }
}
