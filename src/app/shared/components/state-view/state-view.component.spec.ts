import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StateViewComponent } from './state-view.component';

@Component({
  standalone: true,
  imports: [StateViewComponent],
  template: `<app-state-view
    [loading]="loading"
    [error]="error"
    [empty]="empty"
    emptyMessage="Aún no tienes solicitudes"
    (retry)="retried = retried + 1"
    ><span class="content">Contenido</span></app-state-view
  >`,
})
class HostComponent {
  loading = false;
  error: string | null = null;
  empty = false;
  retried = 0;
}

describe('StateViewComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('muestra el indicador de carga con role=status', () => {
    host.loading = true;
    fixture.detectChanges();
    expect(el().querySelector('[role="status"]')?.textContent).toContain('Cargando');
    expect(el().querySelector('.content')).toBeNull();
  });

  it('muestra el error con "Reintentar" y emite retry', () => {
    host.error = 'No se pudo cargar';
    fixture.detectChanges();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar');
    (el().querySelector('button') as HTMLButtonElement).click();
    expect(host.retried).toBe(1);
  });

  it('muestra el mensaje de vacío', () => {
    host.empty = true;
    fixture.detectChanges();
    expect(el().textContent).toContain('Aún no tienes solicitudes');
  });

  it('muestra el contenido cuando no hay carga, error ni vacío', () => {
    fixture.detectChanges();
    expect(el().querySelector('.content')).not.toBeNull();
  });

  it('el error tiene prioridad sobre el vacío', () => {
    host.error = 'Falló';
    host.empty = true;
    fixture.detectChanges();
    expect(el().querySelector('[role="alert"]')).not.toBeNull();
  });
});
