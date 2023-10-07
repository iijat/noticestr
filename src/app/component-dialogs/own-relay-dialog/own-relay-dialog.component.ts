import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-own-relay-dialog',
  templateUrl: './own-relay-dialog.component.html',
  styleUrls: ['./own-relay-dialog.component.scss'],
})
export class OwnRelayDialogComponent implements OnInit {
  get relay(): string | undefined {
    return this._relay;
  }
  set relay(value) {
    window.clearTimeout(this._timeout);
    this._timeout = window.setTimeout(() => {
      this._relay = value;
      this._mainService.setMyInitialRelay(value ?? this._defaultInitialRelay);
    }, 800);
  }

  private _relay: string | undefined;
  private _timeout: number | undefined;
  private _defaultInitialRelay = 'wss://nostr.wine';

  constructor(
    private _mainService: MainService,
    private _dialogRef: MatDialogRef<OwnRelayDialogComponent>
  ) {}

  ngOnInit(): void {
    let initialRelay = this._mainService.myInitialRelay;
    if (!initialRelay) {
      initialRelay = this._defaultInitialRelay;
    }

    this._relay = initialRelay;
  }

  async onClickGo() {
    if (!this.relay) {
      return;
    }

    this._mainService.setMyInitialRelay(this.relay);
    this._dialogRef.close(this.relay);
  }
}
