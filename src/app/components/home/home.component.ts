import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NostrService } from 'src/app/services/nostr.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { NostrConnector } from 'src/app/models/nostrConnector';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  hasNip07 = false;
  showNip46 = false;
  showNip46Details = false;

  constructor(
    private _mainService: MainService,
    public nostrService: NostrService,
    private _router: Router,
    private _clipboard: Clipboard
  ) {}

  async onClickLoginViaNip07() {
    const pubkey = await NostrConnector.getPublicKey('nip-07');
    this._mainService.setMyPubkey(pubkey);
    this._mainService.setMyNostrConnectorUse('nip-07');

    //this.nostrService.goWith('nip07');
    //const pubkey = await this.nostrService.getPublicKey();
    this._router.navigateByUrl(`/base/${pubkey}`);
  }

  onClickLoginViaNip46() {
    this.nostrService.goWith('nip46');
    this.showNip46 = true;

    const subscription = this.nostrService.nip46EventOnline.subscribe(
      async () => {
        subscription.unsubscribe();
        const pubkey = await this.nostrService.getPublicKey();
        this._router.navigateByUrl(`/base/${pubkey}`);
      }
    );

    this.nostrService.generateNip46AppUri();
  }

  onClickBrand() {
    location.reload();
  }

  onClickQRCode() {
    this._clipboard.copy(this.nostrService.nip46AppUriString);
  }
}
