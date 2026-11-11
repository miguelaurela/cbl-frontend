import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { LABELS } from '../../../core/i18n/labels';
import type { User } from '../../../core/models';
import { StateViewComponent } from '../../../shared/components/state-view/state-view.component';
import { selectUser } from '../../../store/auth/auth.selectors';
import { UsersActions } from '../../../store/users/users.actions';
import { selectUsers, selectUsersLoadError, selectUsersLoadStatus } from '../../../store/users/users.selectors';
import { UserDialogComponent, type UserDialogData } from './user-dialog/user-dialog.component';

/** Gestión de usuarios del administrador (FR-019 a FR-021): lista, alta y edición en un diálogo. */
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, StateViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly labels = LABELS;
  readonly users = this.store.selectSignal(selectUsers);
  private readonly currentUser = this.store.selectSignal(selectUser);
  private readonly status = this.store.selectSignal(selectUsersLoadStatus);
  private readonly error = this.store.selectSignal(selectUsersLoadError);

  readonly loading = computed(() => this.status() === 'loading' && this.users().length === 0);
  readonly errorMessage = computed(() => (this.error() ? LABELS.users.loadError : null));
  readonly empty = computed(() => this.status() === 'loaded' && this.users().length === 0);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.store.dispatch(UsersActions.loadUsers());
  }

  isOwn(user: User): boolean {
    return user.id === this.currentUser()?.id;
  }

  /** Abre el diálogo para crear (sin usuario) o editar. */
  openDialog(user: User | null): void {
    const data: UserDialogData = { user, currentUserId: this.currentUser()?.id ?? null };
    this.dialog.open(UserDialogComponent, { data, maxWidth: '95vw', autoFocus: 'first-tabbable' });
  }
}
