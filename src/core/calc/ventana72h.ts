import type { BloqueVentana, ClimaHorario, Semaforo } from '@core/models';
import {
  PESOS,
  PUNTAJE,
  bandaPorScore,
  clasDistAgua,
  clasHumedad,
  clasPrecip,
  clasPuntoRocio,
  clasTemp,
  clasViento,
} from '@core/calc/umbralesAmbientales';

/**
 * M4 — Ventana de fumigación sugerida.
 * Aplica las MISMAS reglas del scoring a cada bloque horario del pronóstico
 * 72 h y devuelve el primer bloque con semáforo verde (la ventana óptima más
 * cercana), o null si ninguno es verde. La distancia a agua es constante
 * (entrada manual del lote) y se incluye en cada evaluación horaria.
 */

export function estadoHora(h: ClimaHorario, distanciaAguaM: number): Semaforo {
  const deltaRocio = h.temperaturaC - h.puntoRocioC;
  const estados: { s: Semaforo; peso: number }[] = [
    { s: clasViento(h.vientoMs), peso: PESOS.viento },
    { s: clasPrecip(h.probPrecipPct), peso: PESOS.precipitacion },
    { s: clasDistAgua(distanciaAguaM), peso: PESOS.distancia_agua },
    { s: clasTemp(h.temperaturaC), peso: PESOS.temperatura },
    { s: clasHumedad(h.humedadRelPct), peso: PESOS.humedad },
    { s: clasPuntoRocio(deltaRocio), peso: PESOS.punto_rocio },
  ];
  const score = estados.reduce((acc, e) => acc + e.peso * PUNTAJE[e.s], 0);
  let estado = bandaPorScore(score);
  if (estado === 'verde' && estados.some((e) => e.s === 'rojo')) estado = 'amarillo';
  return estado;
}

export function calcularVentana72h(
  pronostico: readonly ClimaHorario[],
  distanciaAguaM: number,
): BloqueVentana | null {
  for (const h of pronostico) {
    const estado = estadoHora(h, distanciaAguaM);
    if (estado === 'verde') return { iso: h.iso, estado };
  }
  return null;
}
