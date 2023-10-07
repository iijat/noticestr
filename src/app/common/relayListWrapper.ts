import { Event, Kind } from 'nostr-tools';
import { RelayEvent } from '../models/nostrRelayer';

export type Nip65Relay = {
  url: string;
  tag: 'read' | 'write' | 'read+write';
};

/**
 * https://github.com/nostr-protocol/nips/blob/master/65.md
 */
export class RelayListWrapper {
  get nip65Relays(): Nip65Relay[] {
    if (typeof this._nip65Relays === 'undefined') {
      const relays: Nip65Relay[] = [];
      for (const tag of this.relayEvent.event.tags as string[][]) {
        if (tag[0] !== 'r') {
          continue;
        }

        relays.push({
          url: tag[1],
          tag: (tag[2] as 'read' | 'write' | undefined) ?? 'read+write',
        });
      }
      this._nip65Relays = relays;
    }

    return this._nip65Relays;
  }

  private _nip65Relays: Nip65Relay[] | undefined;

  constructor(public relayEvent: RelayEvent) {
    if (relayEvent.event.kind !== Kind.RelayList) {
      throw new Error('invalid event. Only a kind 10002 event is allowed.');
    }
  }
}
