import {
  Event,
  EventTemplate,
  Filter,
  Kind,
  Relay,
  relayInit,
} from 'nostr-tools';
import { nip42 } from 'nostr-tools';
import { NostrService } from '../services/nostr.service';
import axios from 'axios';
import { Nip11RID } from './typeDefs';

export class RelayConnection {
  get nip11RID() {
    return this._nip11RID;
  }

  private _nip11RID: Nip11RID | undefined;
  private _relay: Relay;

  constructor(private _relayUri: string, private _nostrService: NostrService) {
    this._relay = relayInit(_relayUri);

    this._relay.on('connect', () => {
      console.log(`Connected to relay ${_relayUri}`);
    });

    this._relay.on('error', () => {
      console.log(`Failed to connect to relay ${_relayUri}`);
    });
  }

  goOnline(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._relay.status === WebSocket.OPEN) {
        resolve();
      }

      this._relay.off('auth', (challenge) => this._onAuth(challenge, resolve));

      // Check, if we already have downloaded a NIP11RID from a previous connection.
      if (this._nip11RID) {
        if (this._nip11RID.limitation?.auth_required === true) {
          this._relay.on('auth', (challenge) =>
            this._onAuth(challenge, resolve)
          );
          this._relay.connect();
        } else {
          this._relay.connect().then(() => {
            resolve();
          });
        }
      } else {
        // 1st get Relay information (NIP-11) and check if the provided
        // relay needs authentication.
        axios
          .get(this._relayUri.replace('wss', 'https'), {
            headers: {
              Accept: 'application/nostr+json',
            },
          })
          .then((result) => {
            const rid = result.data as Nip11RID;
            this._nip11RID = rid;

            if (rid?.limitation?.auth_required === true) {
              // The relay requires authentication (NIP-42).
              this._relay.on('auth', (challenge) =>
                this._onAuth(challenge, resolve)
              );
              this._relay.connect();
            } else {
              this._relay.connect().then(() => {
                resolve();
              });
            }
          });
      }
    });
  }

  goOffline() {
    this._relay.close();
  }

  sub(filters: Filter[]): Promise<Event[]> {
    return new Promise((resolve, reject) => {
      const events: Event[] = [];

      const sub = this._relay.sub(filters);

      const timer = window.setTimeout(() => {
        sub.unsub();
        resolve(events);
        return;
      }, 15000);

      const onEvent = function (event: any) {
        events.push(event);
      };

      sub.on('event', onEvent);
      sub.on('eose', () => {
        window.clearTimeout(timer);
        sub.unsub();
        resolve(events);
      });
    });
  }

  async publish(event: Event) {
    await this._relay.publish(event);
  }

  private async _onAuth(challenge: string, success: () => void): Promise<void> {
    const e: EventTemplate = {
      kind: Kind.ClientAuth,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['relay', this._relay.url],
        ['challenge', challenge],
      ],
      content: '',
    };

    const event = await this._nostrService.signEvent(e);

    await this._relay.auth(event);
    success();
  }
}
