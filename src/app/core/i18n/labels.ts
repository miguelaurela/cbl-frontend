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

  loanForm: {
    title: 'Solicitar un préstamo',
    amount: 'Monto',
    term: 'Plazo (meses)',
    submit: 'Solicitar',
    submitting: 'Enviando…',
    success: 'Solicitud enviada. Queda pendiente de revisión.',
    amountHint: (min: string, max: string) => `Entre ${min} y ${max}, con 2 decimales como máximo.`,
    termHint: (min: number, max: number) => `Número entero de ${min} a ${max} meses.`,
    amountRequired: 'Escribe el monto.',
    amountPositive: 'El monto debe ser mayor que 0.',
    amountDecimals: 'El monto admite 2 decimales como máximo.',
    amountMin: (min: string) => `El monto mínimo es ${min}.`,
    amountMax: (max: string) => `El monto máximo es ${max}.`,
    termRequired: 'Escribe el plazo.',
    termInteger: 'El plazo debe ser un número entero de meses.',
    termMin: (min: number) => `El plazo mínimo es ${min} mes.`,
    termMax: (max: number) => `El plazo máximo es ${max} meses.`,
    limitsError: 'No se pudieron cargar los límites de monto.',
  },

  myLoans: {
    title: 'Mis préstamos',
    empty: 'Aún no tienes solicitudes',
    amount: 'Monto',
    term: 'Plazo',
    status: 'Estado',
    requested: 'Solicitado',
    decided: 'Decidido',
    months: (n: number) => (n === 1 ? '1 mes' : `${n} meses`),
    notDecided: '—',
    loadError: 'No se pudieron cargar tus préstamos.',
  },

  adminLoans: {
    title: 'Solicitudes de préstamo',
    filterLabel: 'Filtrar por estado',
    pending: (n: number) => (n === 1 ? '1 pendiente' : `${n} pendientes`),
    borrower: 'Prestamista',
    decidedBy: 'Decidido por',
    empty: 'No hay solicitudes con este filtro',
    loadError: 'No se pudieron cargar las solicitudes.',
    actions: 'Acciones',
    approve: 'Aprobar',
    reject: 'Rechazar',
    deciding: 'Procesando…',
    confirmApproveTitle: '¿Aprobar esta solicitud?',
    confirmRejectTitle: '¿Rechazar esta solicitud?',
    confirmLines: (name: string, amount: string, months: string) => [
      `Prestamista: ${name}`,
      `Monto: ${amount}`,
      `Plazo: ${months}`,
    ],
    approved: 'Solicitud aprobada.',
    rejected: 'Solicitud rechazada.',
    conflict: 'Esta solicitud ya fue decidida por otra persona. Se actualizó la lista.',
    decideError: 'No se pudo registrar la decisión. La solicitud sigue como estaba.',
  },

  users: {
    title: 'Usuarios',
    new: 'Nuevo usuario',
    edit: 'Editar',
    name: 'Nombre',
    email: 'Correo electrónico',
    role: 'Rol',
    status: 'Estado',
    created: 'Creado',
    active: 'Activo',
    inactive: 'Desactivado',
    actions: 'Acciones',
    empty: 'Aún no hay usuarios',
    loadError: 'No se pudieron cargar los usuarios.',
    createTitle: 'Nuevo usuario',
    editTitle: 'Editar usuario',
    fullName: 'Nombre completo',
    password: 'Contraseña',
    passwordCreateHint: 'Entre 8 y 200 caracteres.',
    passwordEditLabel: 'Restablecer contraseña (opcional)',
    passwordEditHint: 'Déjala vacía para conservar la actual. Entre 8 y 200 caracteres.',
    isActive: 'Cuenta activa',
    ownAccount: 'Es tu cuenta: no puedes desactivarla ni cambiar tu propio rol.',
    you: 'Tú',
    created_ok: 'Usuario creado.',
    updated_ok: 'Usuario actualizado.',
    saveError: 'No se pudo guardar el usuario.',
    emailRequired: 'Escribe el correo.',
    nameRequired: 'Escribe el nombre.',
    nameMax: 'El nombre admite 200 caracteres como máximo.',
    emailMax: 'El correo admite 256 caracteres como máximo.',
    passwordRequired: 'Escribe la contraseña.',
    passwordMin: 'La contraseña debe tener al menos 8 caracteres.',
    passwordMax: 'La contraseña admite 200 caracteres como máximo.',
    roleRequired: 'Elige un rol.',
    saving: 'Guardando…',
  },

  limits: {
    title: 'Límites de monto',
    description: 'Mínimo y máximo que puede pedir un prestamista.',
    min: 'Monto mínimo',
    max: 'Monto máximo',
    save: 'Guardar límites',
    saving: 'Guardando…',
    note: 'Se aplica solo a las solicitudes nuevas.',
    saved: 'Límites guardados. Se aplican solo a las solicitudes nuevas.',
    loadError: 'No se pudieron cargar los límites.',
    saveError: 'No se pudieron guardar los límites.',
    required: 'Escribe el valor.',
    minPositive: 'El mínimo debe ser mayor que 0.',
    decimals: 'Admite 2 decimales como máximo.',
    cap: 'El valor supera el tope permitido de 1.000.000.000.000.',
    maxAboveMin: 'El máximo debe ser mayor que el mínimo.',
  },

  demo: {
    banner: 'Modo demostración: datos de ejemplo que se pierden al recargar.',
  },

  nav: {
    myLoans: 'Mis préstamos',
    requests: 'Solicitudes',
    users: 'Usuarios',
    limits: 'Límites',
    main: 'Navegación principal',
    user: 'Usuario',
  },

  forbidden: {
    title: 'Acceso no permitido',
    message: 'No tienes permiso para ver esta pantalla.',
    back: 'Ir a mi vista',
  },

  login: {
    title: 'Iniciar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Entrar',
    submitting: 'Entrando…',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    invalidCredentials: 'Correo o contraseña incorrectos.',
    locked: (wait: string) => `Demasiados intentos fallidos. Espera ${wait} antes de volver a intentarlo.`,
    lockedNoWait: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
    rateLimited: (wait: string) => `Demasiadas solicitudes. Espera ${wait} antes de volver a intentarlo.`,
    rateLimitedNoWait: 'Demasiadas solicitudes. Espera un momento antes de volver a intentarlo.',
    demoHint: 'Modo demostración. Cuentas de ejemplo (contraseña 123): usuario@test.com (Prestamista) y admin@test.com (Administrador).',
    notices: {
      expired: 'Tu sesión expiró. Inicia sesión de nuevo.',
      unauthorized: 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
      loggedOut: 'Cerraste sesión.',
    },
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
