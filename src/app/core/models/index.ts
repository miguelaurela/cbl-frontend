import type { components } from '../api/openapi.generated';

/** Alias legibles de los tipos generados desde el OpenAPI del backend (no editar a mano el contrato). */
type Schemas = components['schemas'];

export type Role = Schemas['Role'];
export type LoanStatus = Schemas['LoanStatus'];
export type Loan = Schemas['Loan'];
export type User = Schemas['User'];
export type LoginRequest = Schemas['LoginRequest'];
export type LoginResponse = Schemas['LoginResponse'];
export type CreateLoanRequest = Schemas['CreateLoanRequest'];
export type DecideLoanRequest = Schemas['DecideLoanRequest'];
export type LoanLimits = Schemas['LoanLimits'];
export type CreateUserRequest = Schemas['CreateUserRequest'];
export type UpdateUserRequest = Schemas['UpdateUserRequest'];
export type ProblemDetails = Schemas['ProblemDetails'];

/** Usuario de la sesión (parte `user` de la respuesta de login). */
export type SessionUser = LoginResponse['user'];

/** Filtro de la lista del administrador: un estado o todos. */
export type LoanFilter = 'All' | LoanStatus;
