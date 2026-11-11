import { InjectionToken } from '@angular/core';

/** Reloj del mock inyectable: las pruebas lo sustituyen para simular el paso del tiempo (caducidad, bloqueo). */
export interface MockClock {
  now(): number;
}

export const MOCK_CLOCK = new InjectionToken<MockClock>('MOCK_CLOCK', {
  providedIn: 'root',
  factory: () => ({ now: () => Date.now() }),
});

/** Latencia simulada en milisegundos; en las pruebas se fija a 0. */
export interface MockLatency {
  min: number;
  max: number;
}

export const MOCK_LATENCY = new InjectionToken<MockLatency>('MOCK_LATENCY', {
  providedIn: 'root',
  factory: () => ({ min: 300, max: 600 }),
});
