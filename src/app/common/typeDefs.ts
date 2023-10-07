import { Kind, nip05 } from 'nostr-tools';
import { RelayEvent } from '../models/nostrRelayer';

export interface Nip11RID {
  name: string;
  description: string;
  pubkey: string;
  contact: string;
  supported_nips: number[];
  software: string;
  version: string;
  limitation?: {
    auth_required: boolean;
  };
}

export interface Metadata {
  about?: string;
  banner?: string;
  name?: string;
  userName?: string;
  picture?: string;
  nip05?: string;
  lud15?: string;
  website?: string;
}

export class MetadataWrapper {
  get confirmedNip05() {
    if (!this._hasEvaluatedNip05) {
      this._hasEvaluatedNip05 = true;
      this.evaluateNip05();
    }
    return this._confirmedNip05;
  }

  get confirmedNip05Relays(): string[] {
    if (!this._hasEvaluatedNip05) {
      this._hasEvaluatedNip05 = true;
      this.evaluateNip05();
    }

    return this._confirmedNip05Relays;
  }

  get metadata() {
    if (!this._metadata) {
      this._metadata = JSON.parse(this.#relayEvent.event.content) as Metadata;
    }

    return this._metadata;
  }

  get relayEvent() {
    return this.#relayEvent;
  }

  private _confirmedNip05: string | undefined;
  private _confirmedNip05Relays: string[] = [];
  private _hasEvaluatedNip05 = false;
  private _metadata: Metadata | undefined;
  #relayEvent: RelayEvent;

  constructor(relayEvent: RelayEvent) {
    if (relayEvent.event.kind !== Kind.Metadata) {
      throw new Error('Invalid event. Only a kind 0 event is allowed.');
    }
    this.#relayEvent = relayEvent;
  }

  reset(newRelayEvent: RelayEvent) {
    this.#relayEvent = newRelayEvent;
    this._hasEvaluatedNip05 = false;
    this._confirmedNip05 = undefined;
    this._confirmedNip05Relays = [];
  }

  async evaluateNip05() {
    if (!this.metadata.nip05) {
      return;
    }

    try {
      const result = await nip05.queryProfile(this.metadata.nip05);
      if (result?.pubkey === this.#relayEvent.event.pubkey) {
        this._confirmedNip05 = this.metadata.nip05;

        if (typeof result.relays !== 'undefined') {
          this._confirmedNip05Relays = result.relays;
        }
      }
    } catch (error) {
      // TODO
    }
  }
}
