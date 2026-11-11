import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import type { AppError } from '../../../../core/errors/app-error';
import { UsersActions } from '../../../../store/users/users.actions';
import { initialUsersState, type UsersState } from '../../../../store/users/users.state';
import { userFixture } from '../../../../testing/fixtures';
import { UserDialogComponent, type UserDialogData } from './user-dialog.component';

describe('UserDialogComponent', () => {
  let store: MockStore;
  let dialogRef: jasmine.SpyObj<MatDialogRef<UserDialogComponent, boolean>>;

  function create(data: UserDialogData, users: Partial<UsersState> = {}) {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideMockStore({ initialState: { users: { ...initialUsersState, ...users } } }),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    });
    store = TestBed.inject(MockStore);
    const dispatch = spyOn(store, 'dispatch');
    const fixture = TestBed.createComponent(UserDialogComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const set = (selector: string, value: string) => {
      const input = element.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = () => {
      (element.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    };
    return { fixture, element, dispatch, set, submit };
  }

  const errors = (element: HTMLElement) => Array.from(element.querySelectorAll('mat-error')).map((e) => e.textContent?.trim() ?? '');
  const newUser: UserDialogData = { user: null, currentUserId: 'me' };

  it('al abrirse limpia el resultado del guardado anterior', () => {
    const { dispatch } = create(newUser);
    expect(dispatch).toHaveBeenCalledWith(UsersActions.resetSave());
  });

  it('alta: obligatorios y contraseña de 7 caracteres inválida, de 8 válida', () => {
    const { element, dispatch, set, submit } = create(newUser);
    dispatch.calls.reset();
    submit();
    expect(dispatch).not.toHaveBeenCalled();
    expect(errors(element).length).toBeGreaterThanOrEqual(3);

    set('input[formcontrolname="email"]', 'nuevo@test.com');
    set('input[formcontrolname="fullName"]', 'Nuevo');
    set('input[formcontrolname="password"]', '1234567');
    submit();
    expect(dispatch).not.toHaveBeenCalled();
    expect(errors(element).join(' ')).toContain('al menos 8');

    set('input[formcontrolname="password"]', '12345678');
    submit();
    expect(dispatch).toHaveBeenCalledOnceWith(
      UsersActions.createUser({ request: { email: 'nuevo@test.com', fullName: 'Nuevo', password: '12345678', role: 'Borrower' } }),
    );
  });

  it('un solo envío mientras se guarda', () => {
    const { dispatch, set, submit } = create(newUser, { saveStatus: 'saving' });
    set('input[formcontrolname="email"]', 'nuevo@test.com');
    set('input[formcontrolname="fullName"]', 'Nuevo');
    set('input[formcontrolname="password"]', '12345678');
    dispatch.calls.reset();
    submit();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('el correo duplicado del servidor aparece junto al campo correo', () => {
    const conflict: AppError = {
      kind: 'conflict',
      status: 409,
      title: 't',
      message: 'Ya existe',
      fieldErrors: { email: ['Ya existe un usuario con ese correo.'] },
    };
    const { fixture, element, set } = create(newUser);
    set('input[formcontrolname="email"]', 'ana@test.com');
    store.setState({ users: { ...initialUsersState, saveStatus: 'failed', saveError: conflict } });
    fixture.detectChanges();
    expect(errors(element)).toContain('Ya existe un usuario con ese correo.');
  });

  it('un guardado correcto cierra el diálogo', () => {
    const { fixture } = create(newUser);
    store.setState({ users: { ...initialUsersState, saveStatus: 'saved' } });
    fixture.detectChanges();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('edición de otra persona: correo bloqueado, rol y estado editables, contraseña opcional', () => {
    const user = userFixture({ id: 'u2', fullName: 'Beto', role: 'Borrower' });
    const { element, dispatch, submit } = create({ user, currentUserId: 'me' });
    expect(element.textContent).toContain('Editar usuario');
    expect((element.querySelector('input[formcontrolname="email"]') as HTMLInputElement).disabled).toBeTrue();
    expect(element.querySelector('mat-slide-toggle')).not.toBeNull();
    expect(element.textContent).not.toContain('no puedes desactivarla');
    dispatch.calls.reset();
    submit();
    expect(dispatch).toHaveBeenCalledOnceWith(
      UsersActions.updateUser({ id: 'u2', request: { fullName: 'Beto', role: 'Borrower', isActive: true } }),
    );
  });

  it('edición: una contraseña de 7 caracteres es inválida y una de 8 se envía', () => {
    const user = userFixture({ id: 'u2', fullName: 'Beto' });
    const { element, dispatch, set, submit } = create({ user, currentUserId: 'me' });
    set('input[formcontrolname="password"]', '1234567');
    dispatch.calls.reset();
    submit();
    expect(dispatch).not.toHaveBeenCalled();
    expect(errors(element).join(' ')).toContain('al menos 8');
    set('input[formcontrolname="password"]', '12345678');
    submit();
    expect(dispatch).toHaveBeenCalledWith(
      UsersActions.updateUser({ id: 'u2', request: { fullName: 'Beto', role: 'Borrower', isActive: true, password: '12345678' } }),
    );
  });

  it('la cuenta propia tiene bloqueados el rol y el estado, con una explicación', () => {
    const user = userFixture({ id: 'me', fullName: 'Yo', role: 'Admin' });
    const { fixture, element } = create({ user, currentUserId: 'me' });
    expect(element.textContent).toContain('no puedes desactivarla ni cambiar tu propio rol');
    expect(fixture.componentInstance.form.controls.role.disabled).toBeTrue();
    expect(fixture.componentInstance.form.controls.isActive.disabled).toBeTrue();
    expect(fixture.componentInstance.form.controls.fullName.disabled).toBeFalse();
  });

  it('la cuenta propia se envía con su rol y estado actuales', () => {
    const user = userFixture({ id: 'me', fullName: 'Yo', role: 'Admin' });
    const { dispatch, submit } = create({ user, currentUserId: 'me' });
    dispatch.calls.reset();
    submit();
    expect(dispatch).toHaveBeenCalledWith(
      UsersActions.updateUser({ id: 'me', request: { fullName: 'Yo', role: 'Admin', isActive: true } }),
    );
  });

  it('un 403 del servidor sobre la propia cuenta se muestra como mensaje', () => {
    const user = userFixture({ id: 'me', role: 'Admin' });
    const { fixture, element } = create({ user, currentUserId: 'me' });
    store.setState({
      users: {
        ...initialUsersState,
        saveStatus: 'failed',
        saveError: { kind: 'forbidden', status: 403, title: 't', message: 'No puedes desactivar tu propia cuenta.', fieldErrors: {} },
      },
    });
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('propia cuenta');
  });
});
