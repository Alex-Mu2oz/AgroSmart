import { describe, expect, it } from 'vitest';
import {
  formatFechaCorta,
  formatFechaLarga,
  formatFechaCompleta,
  formatHoraConDia,
} from '../../shared/utils/date';

describe('Date Utilities', () => {
  const mockIso = '2026-06-06T22:25:55.000Z';

  it('formats dates in local time reliably', () => {
    const d = new Date(mockIso);
    
    const dia = d.getDate().toString().padStart(2, '0');
    const anio = d.getFullYear();
    const hora = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    const seg = d.getSeconds().toString().padStart(2, '0');
    
    // formatFechaCorta: "DD MMM, HH:MM"
    const corta = formatFechaCorta(mockIso);
    expect(corta).toContain(dia);
    expect(corta).toContain(`${hora}:${min}`);
    
    // formatFechaLarga: "DD MMM YYYY, HH:MM"
    const larga = formatFechaLarga(mockIso);
    expect(larga).toContain(dia);
    expect(larga).toContain(anio.toString());
    expect(larga).toContain(`${hora}:${min}`);
    
    // formatFechaCompleta: "DD/MM/YYYY, HH:MM:SS"
    const completa = formatFechaCompleta(mockIso);
    expect(completa).toContain(`${dia}/`);
    expect(completa).toContain(`/${anio},`);
    expect(completa).toContain(`${hora}:${min}:${seg}`);

    // formatHoraConDia: "sem, HH:MM"
    const horaConDia = formatHoraConDia(mockIso);
    expect(horaConDia).toContain(`${hora}:${min}`);
  });

  it('handles invalid dates gracefully', () => {
    expect(formatFechaCorta('invalid-date')).toBe('');
    expect(formatFechaLarga('invalid-date')).toBe('');
    expect(formatFechaCompleta('invalid-date')).toBe('');
    expect(formatHoraConDia('invalid-date')).toBe('');
  });
});
