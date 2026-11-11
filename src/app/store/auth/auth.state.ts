import type { AppError } from '../../core/errors/app-error';
import type { SessionUser } from '../../core/models';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'failed';

/** Aviso que la pantalla de acceso muestra una vez y limpia. */
export type AuthNotice = 'expired' | 'unauthorized' | 'loggedOut';

export interface AuthState {
  status: AuthStatus;
  /** Solo en memoria: nunca se persiste en el navegador (ni almacenamiento ni cookies). */
  token: string | null;
  user: SessionUser | null;
  /** Instante de caducidad (ISO) devuelto por el login. */
  expiresAt: string | null;
  error: AppError | null;
  notice: AuthNotice | null;
}

export const initialAuthState: AuthState = {
  status: 'idle',
  token: null,
  user: null,
  expiresAt: null,
  error: null,
  notice: null,
};

export const AUTH_FEATURE_KEY = 'auth';
