import { RelayEvent } from '../models/nostrRelayer';
import { NostrManager } from '../models/nostrManager';

export class PeopleListWrapper {
  get listName(): string {
    if (!this._listName) {
      for (const tag of this.relayEvent.event.tags) {
        if (tag[0] === 'd') {
          this._listName = tag[1];
          break;
        }
      }
    }

    return this._listName ?? 'Unknown List';
  }

  get publicPubkeys(): string[] {
    if (typeof this._publicPubkeys === 'undefined') {
      const publicPubkeys: string[] = [];
      for (const tag of this.relayEvent.event.tags) {
        if (tag[0] === 'p') {
          publicPubkeys.push(tag[1]);
        }
      }
      this._publicPubkeys = publicPubkeys;
    }

    return this._publicPubkeys;
  }

  get privatePubkeys(): string[] {
    if (typeof this._privatePubkeys === 'undefined') {
      this._privatePubkeys = [];
      this._decryptPrivatePubkeys();
    }

    return this._privatePubkeys;
  }
  set privatePubkeys(value) {
    this._privatePubkeys = value;
  }

  unsafedPublicPubkeys: string[] | undefined;
  get hasUnsafedPublicPubkeys(): boolean {
    return typeof this.unsafedPublicPubkeys !== 'undefined';
  }
  unsafedPrivatePubkeys: string[] | undefined;
  get hasUnsafedPrivatePubkeys(): boolean {
    return typeof this.unsafedPrivatePubkeys !== 'undefined';
  }

  hasUnsafedChanges = false;

  private _listName: string | undefined;
  private _publicPubkeys: string[] | undefined;
  private _privatePubkeys: string[] | undefined;

  constructor(
    public relayEvent: RelayEvent,
    private _nostrManager: NostrManager | undefined
  ) {
    if (relayEvent.event.kind !== (30000 as any)) {
      throw new Error('Invalid event. Only a kind 30000 event is allowed.');
    }
  }

  deletePublicPubkey(pubkey: string) {
    if (typeof this.unsafedPublicPubkeys === 'undefined') {
      this.unsafedPublicPubkeys = Array.from(this.publicPubkeys);
    }

    const index = this.unsafedPublicPubkeys.findIndex((x) => x === pubkey);
    if (index !== -1) {
      this.hasUnsafedChanges = true;
      this.unsafedPublicPubkeys.splice(index, 1);
    }
  }

  addPublicPubkey(pubkey: string) {
    // Only add, if the pubkey is really NEW.
    if (typeof this.unsafedPublicPubkeys === 'undefined') {
      if (this.publicPubkeys.includes(pubkey)) {
        return;
      }
    } else {
      if (this.unsafedPublicPubkeys.includes(pubkey)) {
        return;
      }
    }

    if (typeof this.unsafedPublicPubkeys === 'undefined') {
      this.unsafedPublicPubkeys = Array.from(this.publicPubkeys);
    }

    this.hasUnsafedChanges = true;
    this.unsafedPublicPubkeys.push(pubkey);
  }

  deletePrivatePubkey(pubkey: string) {
    if (typeof this.unsafedPrivatePubkeys === 'undefined') {
      this.unsafedPrivatePubkeys = Array.from(this.privatePubkeys);
    }

    const index = this.unsafedPrivatePubkeys.findIndex((x) => x === pubkey);
    if (index !== -1) {
      this.hasUnsafedChanges = true;
      this.unsafedPrivatePubkeys.splice(index, 1);
    }
  }

  addPrivatePubkey(pubkey: string) {
    // Only add, if the pubkey is really NEW.
    if (typeof this.unsafedPrivatePubkeys === 'undefined') {
      if (this.privatePubkeys.includes(pubkey)) {
        return;
      }
    } else {
      if (this.unsafedPrivatePubkeys.includes(pubkey)) {
        return;
      }
    }

    if (typeof this.unsafedPrivatePubkeys === 'undefined') {
      this.unsafedPrivatePubkeys = Array.from(this.privatePubkeys);
    }

    this.hasUnsafedChanges = true;
    this.unsafedPrivatePubkeys.push(pubkey);
  }

  resetChanges() {
    this.hasUnsafedChanges = false;
    this.unsafedPublicPubkeys = undefined;
    this.unsafedPrivatePubkeys = undefined;
  }

  private async _decryptPrivatePubkeys() {
    const decodedString = await this._nostrManager?.nostrConnector.decrypt(
      this.relayEvent.event.content
    );
    if (!decodedString) {
      return;
    }

    const privateList = JSON.parse(decodedString) as string[][];
    const privatePubkeys: string[] = [];
    for (const item of privateList) {
      if (item[0] === 'p') {
        privatePubkeys.push(item[1]);
      }
    }
    this.privatePubkeys = privatePubkeys;
  }
}
