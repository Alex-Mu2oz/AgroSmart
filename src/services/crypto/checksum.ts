import * as Crypto from 'expo-crypto';
import type { Bitacora } from '@core/models';
import { payloadCanonico } from '@core/calc/decision';

/**
 * Checksum SHA-256 LOCAL del payload canónico de la bitácora (ver D-HASH).
 * Detecta corrupción/edición accidental; NO garantiza no-repudio (eso
 * requeriría backend o firma con Android Keystore).
 */
export async function calcularChecksum(b: Bitacora): Promise<string> {
  const canon = payloadCanonico(b);
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canon);
}

/** Devuelve la bitácora con su checksum calculado. */
export async function sellarBitacora(b: Bitacora): Promise<Bitacora> {
  const checksum = await calcularChecksum(b);
  return { ...b, checksum };
}

/** Verifica que el checksum guardado coincida con el payload actual. */
export async function verificarChecksum(b: Bitacora): Promise<boolean> {
  if (!b.checksum) return false;
  const recalculado = await calcularChecksum(b);
  return recalculado === b.checksum;
}
