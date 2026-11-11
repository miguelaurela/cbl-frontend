import { OverlayContainer } from '@angular/cdk/overlay';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let dialog: MatDialog;
  let overlay: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule] });
    dialog = TestBed.inject(MatDialog);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => dialog.closeAll());

  async function open(lines: string[] = ['Ana Pérez', '$5,000.00']): Promise<MatDialogRef<ConfirmDialogComponent, boolean>> {
    const ref = dialog.open<ConfirmDialogComponent, unknown, boolean>(ConfirmDialogComponent, {
      data: { title: '¿Aprobar solicitud?', lines },
    });
    TestBed.inject(ApplicationRef).tick();
    await firstValueFrom(ref.afterOpened());
    TestBed.inject(ApplicationRef).tick();
    return ref;
  }

  it('muestra el título y las líneas como texto, nunca como HTML', async () => {
    await open(['<b>no es html</b>']);
    expect(overlay.textContent).toContain('¿Aprobar solicitud?');
    expect(overlay.querySelector('b')).toBeNull();
    expect(overlay.textContent).toContain('<b>no es html</b>');
  });

  it('confirmar cierra con true', async () => {
    const ref = await open();
    const result = firstValueFrom(ref.afterClosed());
    (overlay.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(await result).toBeTrue();
  });

  it('cancelar cierra con false', async () => {
    const ref = await open();
    const result = firstValueFrom(ref.afterClosed());
    (overlay.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(await result).toBeFalse();
  });

  it('ofrece dos botones y el foco inicial en el de confirmar (operable con teclado)', async () => {
    await open();
    expect(overlay.querySelectorAll('button').length).toBe(2);
    expect(overlay.querySelector('[cdkfocusinitial]')).not.toBeNull();
  });
});
