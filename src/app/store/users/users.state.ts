import type { AppError } from '../../core/errors/app-error';
import type { User } from '../../core/models';

export type UsersLoadStatus = 'idle' | 'loading' | 'loaded' | 'failed';
export type UsersSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface UsersState {
  items: User[];
  loadStatus: UsersLoadStatus;
  loadError: AppError | null;
  saveStatus: UsersSaveStatus;
  /** `saveError.fieldErrors` alimenta el diálogo (por ejemplo, `email` duplicado). */
  saveError: AppError | null;
}

export const initialUsersState: UsersState = {
  items: [],
  loadStatus: 'idle',
  loadError: null,
  saveStatus: 'idle',
  saveError: null,
};

export const USERS_FEATURE_KEY = 'users';
