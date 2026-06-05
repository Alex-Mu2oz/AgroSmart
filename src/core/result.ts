/**
 * `Result<T, E>` ligero para flujos que pueden fallar de forma esperada
 * (cálculo de mezcla con volumen insuficiente, errores de red en servicios).
 * Evita lanzar excepciones a través de las capas: el fallo es un valor.
 */

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = string> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

/** Devuelve el valor o lanza (usar solo en tests o donde el error es un bug). */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw new Error(`unwrap sobre Err: ${JSON.stringify(r.error)}`);
}
