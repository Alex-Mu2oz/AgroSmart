import type {
  Alerta,
  EntradaAmbiental,
  EvaluacionAmbiental,
  Semaforo,
  VariableAmbientalEvaluada,
} from '@core/models';
import { calcularVentana72h } from '@core/calc/ventana72h';
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
 * M4 — Scoring ambiental ponderado del momento (Tabla M4.1, Anexo I).
 * Los umbrales viven en `umbralesAmbientales.ts` (DRY con la ventana 72 h).
 *
 * score_global = Σ(peso × puntaje); banda verde<2 / amarillo 2–6 / rojo>6.
 * Regla extra: si alguna variable es roja, el global no puede ser verde.
 */

function evaluarVariable(
  clave: VariableAmbientalEvaluada['clave'],
  valor: number,
  estado: Semaforo,
  peso: number,
): VariableAmbientalEvaluada {
  return { clave, valor, estado, peso, puntaje: PUNTAJE[estado] };
}

export function scoreAmbiental(entrada: EntradaAmbiental): EvaluacionAmbiental {
  const { actual, distanciaAguaM } = entrada;
  const deltaRocio = actual.temperaturaC - actual.puntoRocioC;

  const variables: VariableAmbientalEvaluada[] = [
    evaluarVariable('viento', actual.vientoMs, clasViento(actual.vientoMs), PESOS.viento),
    evaluarVariable(
      'precipitacion',
      actual.probPrecip2hPct,
      clasPrecip(actual.probPrecip2hPct),
      PESOS.precipitacion,
    ),
    evaluarVariable(
      'distancia_agua',
      distanciaAguaM,
      clasDistAgua(distanciaAguaM),
      PESOS.distancia_agua,
    ),
    evaluarVariable('temperatura', actual.temperaturaC, clasTemp(actual.temperaturaC), PESOS.temperatura),
    evaluarVariable('humedad', actual.humedadRelPct, clasHumedad(actual.humedadRelPct), PESOS.humedad),
    evaluarVariable('punto_rocio', deltaRocio, clasPuntoRocio(deltaRocio), PESOS.punto_rocio),
  ];

  const scoreGlobal = variables.reduce((acc, v) => acc + v.peso * v.puntaje, 0);
  const hayRoja = variables.some((v) => v.estado === 'rojo');

  let estado: Semaforo = bandaPorScore(scoreGlobal);
  if (estado === 'verde' && hayRoja) estado = 'amarillo';

  const alertas: Alerta[] = variables
    .filter((v) => v.estado !== 'verde')
    .map((v) => ({ severidad: v.estado, codigo: `M4_${v.clave.toUpperCase()}`, mensaje: mensajeVariable(v) }));

  const ventanaSugerida = calcularVentana72h(entrada.pronostico72h, distanciaAguaM);

  return {
    estado,
    scoreGlobal,
    variables,
    ventanaSugerida,
    antiguedadMin: entrada.antiguedadMin ?? 0,
    alertas,
  };
}

function mensajeVariable(v: VariableAmbientalEvaluada): string {
  const nivel = v.estado === 'rojo' ? 'crítico' : 'precaución';
  const etiquetas: Record<VariableAmbientalEvaluada['clave'], string> = {
    viento: `Viento ${v.valor.toFixed(1)} m/s`,
    precipitacion: `Prob. de precipitación ${v.valor.toFixed(0)} %`,
    distancia_agua: `Distancia a cuerpo de agua ${v.valor.toFixed(0)} m`,
    temperatura: `Temperatura ${v.valor.toFixed(1)} °C`,
    humedad: `Humedad relativa ${v.valor.toFixed(0)} %`,
    punto_rocio: `Margen punto de rocío ${v.valor.toFixed(1)} °C`,
  };
  return `${etiquetas[v.clave]} (${nivel})`;
}
