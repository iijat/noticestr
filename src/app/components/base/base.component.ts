import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OwnRelayDialogComponent } from 'src/app/component-dialogs/own-relay-dialog/own-relay-dialog.component';
import { NostrManager } from 'src/app/models/nostrManager';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  pubkey: string | undefined;

  constructor(
    private _matDialog: MatDialog,
    private _mainService: MainService
  ) {}

  ngOnInit(): void {
    if (!this._mainService.myPubkey || !this._mainService.myNostrConnectorUse) {
      throw new Error(
        'Could not detect your public key and use case (browser extension or remote signer).'
      );
    }

    if (typeof this._mainService.nostrManager === 'undefined') {
      // First run.
      this._mainService.setNostrManager(
        new NostrManager({
          pubkey: this._mainService.myPubkey,
          use: this._mainService.myNostrConnectorUse,
        })
      );
    } else {
      // The user was routed to home and has active relays.
      this._mainService.nostrManager.nostrConnector.updateUse(
        this._mainService.myNostrConnectorUse
      );
    }

    const dialog = this._matDialog.open(OwnRelayDialogComponent, {
      autoFocus: false,
      maxWidth: 640,
    });

    dialog.afterClosed().subscribe((initialRelay: string | undefined) => {
      // this._relayService.crawlMe(
      //   this._mainService.myPubkey ?? 'na',
      //   initialRelay
      // );
    });
  }

  //private async _loadData(relay: string, pubkey: string) {}
}
