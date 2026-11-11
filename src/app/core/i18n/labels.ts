import type { LoanStatus, Role } from '../models';

/** Único lugar con textos de la interfaz (español, sin librería de i18n). Cada historia añade los suyos. */
export const LABELS = {
  appName: 'CBL',

  roles: {
    Admin: 'Administrador',
    Borrower: 'Prestamista',
  } satisfies Record<Role, string>,

  loanStatus: {
    Pending: 'Pendiente',
    Approved: 'Aprobado',
    Rejected: 'Rechazado',
  } satisfies Record<LoanStatus, string>,

  common: {
    loading: 'Cargando…',
    empty: 'No hay datos para mostrar.',
    error: 'No se pudo completar la operación.',
    retry: 'Reintentar',
    refresh: 'Actualizar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    close: 'Cerrar',
    logout: 'Cerrar sesión',
    all: 'Todos',
    yes: 'Sí',
    no: 'No',
  },

  errors: {
    required: 'Este campo es obligatorio.',
    email: 'Escribe un correo con formato válido.',
    maxlength: (max: number) => `Máximo ${max} caracteres.`,
    minlength: (min: number) => `Mínimo ${min} caracteres.`,
    server: 'El servidor rechazó este valor.',
    generic: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    network: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    forbidden: 'No tienes permiso para realizar esta acción.',
    notFound: 'No se encontró el recurso solicitado.',
    conflict: 'La operación entra en conflicto con el estado actual.',
    reference: (traceId: string) => `Código de referencia: ${traceId}`,
    waitMinutesSeconds: (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      if (minutes > 0 && rest > 0) {
        return `${minutes} min ${rest} s`;
      }
      return minutes > 0 ? `${minutes} min` : `${rest} s`;
    },
  },
} as const;

export type Labels = typeof LABELS;
