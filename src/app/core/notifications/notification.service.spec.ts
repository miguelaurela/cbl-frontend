import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let service: NotificationService;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snackBar }] });
    service = TestBed.inject(NotificationService);
  });

  it('muestra los avisos 4 segundos y con aria-live educado', () => {
    service.success('Hecho');
    const [message, action, config] = snackBar.open.calls.mostRecent().args;
    expect(message).toBe('Hecho');
    expect(action).toBe('Cerrar');
    expect(config?.duration).toBe(4000);
    expect(config?.politeness).toBe('polite');
  });

  it('distingue éxito, error e información con una clase propia', () => {
    service.success('a');
    expect(snackBar.open.calls.mostRecent().args[2]?.panelClass).toBe('cbl-snack-success');
    service.error('b');
    expect(snackBar.open.calls.mostRecent().args[2]?.panelClass).toBe('cbl-snack-error');
    service.info('c');
    expect(snackBar.open.calls.mostRecent().args[2]?.panelClass).toBe('cbl-snack-info');
  });
});
