import type { CreateUserRequest, Role, UpdateUserRequest, User } from '../models';
import type { MockUser } from './mock-db';
import { ok, problem, route, type MockContext, type MockResult, type MockRoute } from './mock-router';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: readonly Role[] = ['Admin', 'Borrower'];
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;

/** Nunca se devuelve la contraseña. */
const toUser = (user: MockUser): User => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

function validateName(value: unknown, errors: Record<string, string[]>): void {
  if (typeof value !== 'string' || value.trim() === '') {
    errors['fullName'] = ['El nombre es obligatorio.'];
  } else if (value.trim().length > 200) {
    errors['fullName'] = ['El nombre admite 200 caracteres como máximo.'];
  }
}

function validatePassword(value: unknown, required: boolean, errors: Record<string, string[]>): void {
  if (value === undefined || value === null || value === '') {
    if (required) {
      errors['password'] = ['La contraseña es obligatoria.'];
    }
    return;
  }
  if (typeof value !== 'string' || value.length < PASSWORD_MIN || value.length > PASSWORD_MAX) {
    errors['password'] = [`La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`];
  }
}

function validateRole(value: unknown, errors: Record<string, string[]>): void {
  if (!ROLES.includes(value as Role)) {
    errors['role'] = ['El rol debe ser Admin o Borrower.'];
  }
}

function listUsers({ db }: MockContext): MockResult {
  return ok(db.users.map(toUser));
}

function createUser({ body, db, now }: MockContext): MockResult {
  const request = (body ?? {}) as Partial<CreateUserRequest>;
  const errors: Record<string, string[]> = {};
  const email = typeof request.email === 'string' ? request.email.trim() : '';
  if (email === '') {
    errors['email'] = ['El correo es obligatorio.'];
  } else if (!EMAIL_FORMAT.test(email) || email.length > 256) {
    errors['email'] = ['El correo no tiene un formato válido.'];
  }
  validateName(request.fullName, errors);
  validatePassword(request.password, true, errors);
  validateRole(request.role, errors);
  if (Object.keys(errors).length > 0) {
    return problem(422, 'Error de validación', { errors });
  }
  if (db.findUserByEmail(email)) {
    return problem(409, 'Conflicto', {
      detail: 'Ya existe un usuario con ese correo.',
      errors: { email: ['Ya existe un usuario con ese correo.'] },
    });
  }
  const user: MockUser = {
    id: db.newId(),
    email,
    fullName: (request.fullName as string).trim(),
    role: request.role as Role,
    isActive: true,
    createdAt: new Date(now).toISOString(),
    password: request.password as string,
  };
  db.users.push(user);
  return ok(toUser(user), 201);
}

function updateUser({ params, body, db, claims }: MockContext): MockResult {
  const user = db.findUserById(params['id'] ?? '');
  if (!user) {
    return problem(404, 'No encontrado', { detail: 'El usuario no existe.' });
  }
  const request = (body ?? {}) as Partial<UpdateUserRequest>;
  const errors: Record<string, string[]> = {};
  validateName(request.fullName, errors);
  validateRole(request.role, errors);
  if (typeof request.isActive !== 'boolean') {
    errors['isActive'] = ['El estado es obligatorio.'];
  }
  validatePassword(request.password, false, errors);
  if (Object.keys(errors).length > 0) {
    return problem(422, 'Error de validación', { errors });
  }
  // Un administrador no puede desactivarse ni cambiarse el rol a sí mismo.
  if (user.id === claims?.sub && (request.isActive === false || request.role !== user.role)) {
    return problem(403, 'Acceso denegado', {
      detail: 'No puedes desactivar tu propia cuenta ni cambiar tu propio rol.',
    });
  }
  user.fullName = (request.fullName as string).trim();
  user.role = request.role as Role;
  user.isActive = request.isActive as boolean;
  if (request.password) {
    user.password = request.password;
  }
  return ok(toUser(user));
}

export const USER_ROUTES: MockRoute[] = [
  route('GET', '/api/users', listUsers, ['Admin']),
  route('POST', '/api/users', createUser, ['Admin']),
  route('PUT', '/api/users/{id}', updateUser, ['Admin']),
];
