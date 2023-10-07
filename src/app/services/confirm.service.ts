import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  ConfirmDialogResult,
} from '../component-dialogs/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  constructor(private _matDialog: MatDialog) {}

  show(text: string, confirmed?: () => Promise<void>) {
    const data: ConfirmDialogData = {
      text,
    };

    const dialog = this._matDialog.open(ConfirmDialogComponent, {
      data,
    });

    dialog.afterClosed().subscribe(async (ok: ConfirmDialogResult) => {
      if (!ok || typeof confirmed === 'undefined') {
        return;
      }

      await confirmed();
    });
  }
}
