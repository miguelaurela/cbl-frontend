import { TestBed } from '@angular/core/testing';
import type { LoanStatus } from '../../../core/models';
import { StatusChipComponent } from './status-chip.component';

describe('StatusChipComponent', () => {
  const render = (status: LoanStatus) => {
    const fixture = TestBed.createComponent(StatusChipComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const cases: [LoanStatus, string, string][] = [
    ['Pending', 'Pendiente', 'schedule'],
    ['Approved', 'Aprobado', 'check_circle'],
    ['Rejected', 'Rechazado', 'cancel'],
  ];

  for (const [status, text, icon] of cases) {
    it(`muestra ${status} con texto en español e icono (no solo color)`, () => {
      const element = render(status);
      expect(element.textContent).toContain(text);
      expect(element.querySelector('mat-icon')?.textContent?.trim()).toBe(icon);
      expect(element.querySelector('.chip')?.classList).toContain(`status-${status.toLowerCase()}`);
    });
  }
});
