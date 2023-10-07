import { Injectable } from '@angular/core';
import { Nip46App, Nip46AppEvent, Nip46Uri } from '@iijat-sw/nip46';
import {
  Event,
  EventTemplate,
  generatePrivateKey,
  getPublicKey,
} from 'nostr-tools';
import { Subject } from 'rxjs';
import { LOCAL_STORAGE } from '../common/localstorage';

@Injectable({
  providedIn: 'root',
})
export class NostrService {
  isNip07Available = false;
  nip46AppRelay = 'wss://relay.damus.io';
  get nip46AppUriString(): string {
    return this._nip46AppUri?.toURI() ?? 'na';
  }
  get pubkey(): string | undefined {
    return this._pubkey;
  }

  get hasGoWith(): boolean {
    return this._goWithNip07 || this._goWithNip46;
  }

  nip46EventOnline = new Subject();

  private _isNip07Available = false;
  private _goWithNip07 = false;
  private _goWithNip46 = false;
  private _pubkey: string | undefined;

  private _nip46AppPrivkey: string;
  private _nip46AppUri: Nip46Uri | undefined;
  private _nip46App: Nip46App | undefined;

  constructor() {
    // Generate in case we need it.
    this._nip46AppPrivkey = generatePrivateKey();

    window.setTimeout(() => {
      if (typeof window.nostr !== 'undefined') {
        this.isNip07Available = true;
      }
    }, 200);
  }

  generateNip46AppUri() {
    this._nip46AppUri = new Nip46Uri({
      pubkey: getPublicKey(this._nip46AppPrivkey),
      relay: this.nip46AppRelay,
      metadata: {
        name: 'NOTICEstr',
        url: 'https://noticestr.com',
        description: 'Send your messages to a list of recipients.',
      },
    });

    this._nip46App?.goOffline();

    this._startNip46App(this._nip46AppUri);
  }

  goWith(go: 'nip07' | 'nip46') {
    localStorage.setItem(LOCAL_STORAGE.GO_WITH, go);

    if (go === 'nip07') {
      this._goWithNip07 = true;
    } else {
      this._goWithNip46 = true;
    }
  }

  async getPublicKey(): Promise<string> {
    let pubkey: string | undefined;
    if (this._goWithNip07) {
      pubkey = await window.nostr?.getPublicKey();
    } else {
      pubkey = await this._nip46App?.sendGetPublicKey();
    }

    if (!pubkey) {
      throw new Error('Error retrieving the public key.');
    }

    this._pubkey = pubkey;
    return pubkey;
  }

  async signEvent<K extends number = number>(
    eventTemplate: EventTemplate<K>
  ): Promise<Event<K>> {
    if (this._goWithNip07) {
      const event = await window.nostr?.signEvent(eventTemplate);
      if (!event) {
        throw new Error('Error signing the event.');
      }

      return event as Event<K>;
    }

    const event = await this._nip46App?.sendSignEvent(eventTemplate);
    if (!event) {
      throw new Error('Error signing the event.');
    }

    return event as Event<K>;
  }

  async decrypt(pubkey: string, ciphertext: string): Promise<string> {
    if (this._goWithNip07 && window.nostr?.nip04) {
      const plaintext = await window.nostr.nip04.decrypt(pubkey, ciphertext);
      return plaintext;
    }

    return '';
  }

  async encrypt(pubkey: string, plaintext: string): Promise<string> {
    if (this._goWithNip07 && window.nostr?.nip04) {
      const ciphertext = await window.nostr.nip04.encrypt(pubkey, plaintext);
      return ciphertext;
    }

    return '';
  }

  private _startNip46App(uri: Nip46Uri) {
    this._nip46App = new Nip46App(uri, this._nip46AppPrivkey);

    this._nip46App.events.once(
      Nip46AppEvent.IncomingRequest_connect,
      this._nip46OnConnect.bind(this)
    );

    this._nip46App.goOnline();
  }

  private async _nip46OnConnect() {
    this.nip46EventOnline.next(null);
  }
}
