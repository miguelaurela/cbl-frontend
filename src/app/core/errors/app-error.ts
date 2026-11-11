/** Clasificación de errores que la interfaz sabe mostrar (constitución IV, FR-025). */
export type AppErrorKind =
  | 'validation' // 400 y 422: errores por campo o mensaje
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'notFound' // 404
  | 'conflict' // 409
  | 'locked' // 423: correo bloqueado
  | 'rateLimited' // 429: límite de solicitudes
  | 'unexpected'; // red, 5xx y cuerpos que no son ProblemDetails

export interface AppError {
  kind: AppErrorKind;
  status: number;
  title: string;
  /** Mensaje para mostrar al usuario (el `detail` del servidor o un texto genérico). */
  message: string;
  /** Errores por campo, con las claves en camelCase del contrato. */
  fieldErrors: Record<string, string[]>;
  /** Segundos de espera informados por `Retry-After` (423 y 429). */
  retryAfterSeconds?: number;
  /** Código de referencia del servidor: solo se conserva en errores inesperados. */
  traceId?: string;
}
