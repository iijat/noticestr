import {
  Event,
  EventTemplate,
  Filter,
  Kind,
  Relay,
  relayInit,
} from 'nostr-tools';
import { NostrConnector } from './nostrConnector';
import { Nip11RID } from '../common/typeDefs';
import axios from 'axios';
import '../common/arrayExtensions';
import { v4 } from 'uuid';
import { NostrPubSub } from './nostrPubSub';
import EventEmitter from 'events';
import { NostrEventCache } from './nostrEventCache';

export type FetchResult<T> = {
  value: T | undefined;
  event: Event | undefined;
  fromRelays: string[];
  foundOnRelays: string[];
};

export type NostrRelayerConfig = {
  connector: NostrConnector;
};

export type RelayEvent = {
  event: Event;
  url: string;
};

export class NostrRelayer {
  readonly cache = new NostrEventCache();

  get relays() {
    return this.#relays;
  }

  readonly #relays = new Map<string, Relay>();
  readonly nip11RIDs = new Map<string, Nip11RID>();

  #relayAuthEvent = new EventEmitter();

  constructor(
    public conf: NostrRelayerConfig,
    private _nostrPubSub: NostrPubSub
  ) {}

  // #region Public Methods

  publishEvent(channelId: string, event: Event, toRelays: string[]) {
    const relays = this.#getRelays(toRelays);
    let count = 0;

    for (const relay of relays) {
      this.#publish(relay, event)
        .then((relayEvent) => {
          // Cache events
          this.cache.cacheEvents([relayEvent]);

          count++;
          this._nostrPubSub.emitAsync(channelId, count === relays.length, [
            relayEvent,
          ]);
        })
        .catch((error) => {
          console.log(error);
          count++;
          if (count === relays.length) {
            this._nostrPubSub.emitAsync(channelId, true, []);
          }
        });
    }
  }

  /**
   * Kinds: 0 or 3 or 10000 - 19999
   */
  fetchReplaceableEvents(
    channelId: string,
    pubkey: string,
    kinds: number[],
    fromRelays: string[]
  ) {
    if (kinds.find((x) => (x < 10000 && x != 0 && x != 3) || x > 19999)) {
      console.log('WRONG KINDS');
      this._nostrPubSub.emitAsync(channelId, true, []);
      return;
    }

    const eventFilters: Filter[] = [
      {
        kinds,
        authors: [pubkey],
      },
      {
        kinds: [Kind.EventDeletion],
        authors: [pubkey],
        '#a': kinds.map((x) => `${x}:${pubkey}`),
      },
    ];

    const relayEventsChannelId = v4();
    this._nostrPubSub.on(
      relayEventsChannelId,
      (eos: boolean, relayEvents: RelayEvent[]) => {
        //
        this._nostrPubSub.emitAsync(channelId, eos, relayEvents);
      }
    );
    this.#fetchRelayEvents(relayEventsChannelId, eventFilters, fromRelays);
  }

  /**
   * Kinds: 30000 - 39999
   */
  fetchParameterizedReplaceableEvents(
    channelId: string,
    pubkey: string,
    kinds: number[],
    fromRelays: string[]
  ) {
    if (kinds.find((x) => x < 30000) || kinds.find((x) => x > 39999)) {
      this._nostrPubSub.emitAsync(channelId, true, []);
      return;
    }

    const eventFilters: Filter[] = [
      {
        kinds,
        authors: [pubkey],
      },
    ];

    const regularEvents: RelayEvent[] = [];
    const relayEventsChannelId = v4();
    this._nostrPubSub.on(
      relayEventsChannelId,
      (eos: boolean, relayEvents: RelayEvent[]) => {
        if (relayEvents.length > 0) {
          regularEvents.push(...relayEvents);
        }

        this._nostrPubSub.emitAsync(channelId, false, relayEvents);

        if (!eos) {
          return;
        }

        // End of (first) event stream.
        // Stop it so no new events can come in.

        // Determine the d-tags to create the deletion filters.
        const dInfos = new Map<number, Set<string>>();
        for (const regularEvent of regularEvents) {
          let dSet = dInfos.get(regularEvent.event.kind);
          if (typeof dSet === 'undefined') {
            dSet = new Set<string>();
            dInfos.set(regularEvent.event.kind, dSet);
          }

          for (const tag of regularEvent.event.tags) {
            if (tag[0] === 'd') {
              dSet.add(tag[1]);
              break;
            }
          }
        }

        const aFilter: string[] = [];
        for (const dInfo of dInfos) {
          aFilter.push(
            ...Array.from(dInfo[1]).map((x) => `${dInfo[0]}:${pubkey}:${x}`)
          );
        }

        const deletionFilters: Filter[] = [
          {
            kinds: [Kind.EventDeletion],
            authors: [pubkey],
            '#a': aFilter,
          },
        ];

        const innerRelayEventsChannelId = v4();
        this._nostrPubSub.on(
          innerRelayEventsChannelId,
          (eos: boolean, relayEvents: RelayEvent[]) => {
            this._nostrPubSub.emitAsync(channelId, eos, relayEvents);
          }
        );
        this.#fetchRelayEvents(
          innerRelayEventsChannelId,
          deletionFilters,
          fromRelays
        );
      }
    );
    this.#fetchRelayEvents(relayEventsChannelId, eventFilters, fromRelays);
  }

  // #region Common

  // TODO

  // #endregion Common

  // #region 30078

  async fetch30078Data<T>(
    name: string,
    fromRelays: string[]
  ): Promise<FetchResult<T>> {
    if (fromRelays.empty()) {
      return {
        value: undefined,
        event: undefined,
        fromRelays,
        foundOnRelays: [],
      };
    }

    const allRelayEvents = await this.#fetchAll30078Events(name, fromRelays);
    const result = this.#filterAll30078Events(allRelayEvents);

    if (typeof result === 'undefined') {
      return {
        value: undefined,
        event: undefined,
        fromRelays,
        foundOnRelays: [],
      };
    }

    const decodedContent = await this.conf.connector.decrypt(result[0].content);

    return {
      value: JSON.parse(decodedContent) as T,
      event: result[0],
      fromRelays,
      foundOnRelays: result[1],
    };
  }

  publish30078Data<T>(
    data: T,
    name: string,
    toRelays: string[]
  ): Promise<RelayEvent[]> {
    return new Promise((resolve, reject) => {
      const unencryptedContent = JSON.stringify(data);
      this.conf.connector
        .encrypt(unencryptedContent)
        .then((content) => {
          const eventTemplate: EventTemplate = {
            kind: 30078 as any,
            tags: [['d', name]],
            content,
            created_at: Math.floor(new Date().getTime() / 1000),
          };

          this.conf.connector
            .signEvent(eventTemplate)
            .then((event) => {
              const channelId = v4();
              const returnedRelayEvents: RelayEvent[] = [];
              this._nostrPubSub.on(channelId, (eos, relayEvents) => {
                returnedRelayEvents.push(...relayEvents);
                if (eos) {
                  resolve(returnedRelayEvents);
                  return;
                }
              });
              this.publishEvent(channelId, event, toRelays);
            })
            .catch((error) => {
              reject(error);
              return;
            });
        })
        .catch((error) => {
          reject(error);
          return;
        });
    });
  }

  // #endregion 30078

  // #endregion Public Methods

  // #region Private Methods

  // #region Common

  #getRelay(url: string): Relay {
    let relay = this.#relays.get(url);
    if (relay) {
      return relay;
    }

    relay = relayInit(url);
    this.#relays.set(url, relay);
    return relay;
  }

  #getRelays(urls: string[]): Relay[] {
    const relays: Relay[] = [];
    urls.forEach((x) => relays.push(this.#getRelay(x)));
    return relays;
  }

  #list(relay: Relay, filters: Filter[]): Promise<RelayEvent[]> {
    return new Promise<RelayEvent[]>((resolve, reject) => {
      // TIME SAFEGUARD
      const timer = window.setTimeout(() => {
        reject(`Timeout on ${relay.url}`);
        return;
      }, 5000);

      this.#goOnline(relay)
        .then(() => {
          relay
            .list(filters)
            .then((events) => {
              window.clearTimeout(timer);
              resolve(
                events.map((x) => {
                  return { event: x, url: relay.url };
                })
              );
              return;
            })
            .catch((error) => {
              window.clearTimeout(timer);
              reject(error);
              return;
            });
        })
        .catch((error) => {
          window.clearTimeout(timer);
          console.log(error);
          reject(error);
          return;
        });
    });
  }

  #publish(relay: Relay, event: Event) {
    return new Promise<RelayEvent>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject('Timeout.');
      }, 5000);

      this.#goOnline(relay)
        .then(() => {
          relay
            .publish(event)
            .then(() => {
              relay
                .get({ ids: [event.id] })
                .then((returnedEvent) => {
                  window.clearTimeout(timeout);

                  if (returnedEvent == null) {
                    reject();
                    return;
                  }

                  resolve({
                    event: returnedEvent,
                    url: relay.url,
                  });
                  return;
                })
                .catch((error) => {
                  window.clearTimeout(timeout);
                  reject(error);
                  return;
                });
            })
            .catch((error) => {
              window.clearTimeout(timeout);
              reject(error);
              return;
            });
        })
        .catch((error) => {
          window.clearTimeout(timeout);
          console.log(error);
          reject(error);
          return;
        });
    });
  }

  #goOnline(relay: Relay): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('ASSURE ONLINE on ' + relay.url + ' - ' + relay.status);

      if (relay.status === WebSocket.OPEN) {
        resolve();
      }

      // relay.off('auth', (challenge) =>
      //   this.#onAuthRelay(relay, challenge, resolve)
      // );

      // Check, if we already have downloaded a NIP11RID from a previous connection.
      let nip11RID = this.nip11RIDs.get(relay.url);
      if (nip11RID) {
        if (nip11RID.limitation?.auth_required === true) {
          // Just listen to an auth event (which should come).
          this.#relayAuthEvent.once(relay.url, (ok: boolean) => {
            if (ok) {
              resolve();
            } else {
              reject();
            }
          });

          relay.connect();
        } else {
          relay.connect().then(() => {
            resolve();
          });
        }
      } else {
        // 1st get Relay information (NIP-11) and check if the provided
        // relay needs authentication.
        axios
          .get(
            relay.url.replace('wss://', 'https://').replace('ws://', 'http://'),
            {
              headers: {
                Accept: 'application/nostr+json',
              },
            }
          )
          .then((result) => {
            nip11RID = result.data as Nip11RID;
            this.nip11RIDs.set(relay.url, nip11RID);

            if (nip11RID?.limitation?.auth_required === true) {
              // The relay requires authentication (NIP-42).
              this.#relayAuthEvent.once(relay.url, (ok: boolean) => {
                if (ok) {
                  resolve();
                } else {
                  reject();
                }
              });

              relay.on('auth', (challenge) =>
                this.#onAuthRelay(relay, challenge)
                  .then(() => {
                    this.#relayAuthEvent.emit(relay.url, true);
                  })
                  .catch((error) => {
                    this.#relayAuthEvent.emit(relay.url, false);
                  })
              );
              relay.connect();
            } else {
              relay.connect().then(() => {
                resolve();
              });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });
  }

  async #onAuthRelay(relay: Relay, challenge: string): Promise<void> {
    const e: EventTemplate = {
      kind: Kind.ClientAuth,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['relay', relay.url],
        ['challenge', challenge],
      ],
      content: '',
    };

    const event = await this.conf.connector.signEvent(e);

    await relay.auth(event);
    console.log(`Successfully authenticated on ${relay.url}`);
  }

  #fetchRelayEvents(
    channelId: string,
    filters: Filter[],
    fromRelays: string[]
  ) {
    const relays = this.#getRelays(fromRelays);

    let count = 0;

    for (const relay of relays) {
      this.#list(relay, filters)
        .then((results) => {
          // Cache events
          this.cache.cacheEvents(results);

          count++;
          this._nostrPubSub.emitAsync(
            channelId,
            count === relays.length,
            results
          );
        })
        .catch((error) => {
          console.log(error);
          count++;
          if (count === relays.length) {
            this._nostrPubSub.emitAsync(channelId, true, []);
          }
        });
    }
  }

  // #endregion Common

  // #region Parameterized Replaceable Events Kind 30000 - 40000

  #filterParameterizedReplaceableEvents(
    regularEvents: RelayEvent[],
    deletionEvents: RelayEvent[]
  ): RelayEvent[] {
    // identifier: `kind:pubkey:d-tag
    const identifiedDeletionEvents = new Map<string, RelayEvent[]>();
    for (const deletionEvent of deletionEvents) {
      const identifier = `${deletionEvent.event.kind}:${
        deletionEvent.event.pubkey
      }:${this.#getDIdentifier(deletionEvent.event.tags)}`;

      const list = identifiedDeletionEvents.get(identifier);
      if (typeof list === 'undefined') {
        identifiedDeletionEvents.set(identifier, [deletionEvent]);
      } else {
        list.push(deletionEvent);
      }
    }

    // identifier: `kind:pubkey:d-tag
    const filteredRegularEvents = new Map<string, RelayEvent[]>();
    for (const regularEvent of regularEvents) {
      const identifier = `${regularEvent.event.kind}:${
        regularEvent.event.pubkey
      }:${this.#getDIdentifier(regularEvent.event.tags)}`;

      const deletionList = identifiedDeletionEvents.get(identifier) ?? [];
      if (
        !deletionList.empty() &&
        deletionList.sortBy((x) => x.event.created_at, 'desc')[0].event
          .created_at > regularEvent.event.created_at
      ) {
        continue;
      }

      const list = filteredRegularEvents.get(identifier);
      if (typeof list === 'undefined') {
        filteredRegularEvents.set(identifier, [regularEvent]);
      } else {
        list.push(regularEvent);
      }
    }

    const filteredEvents: RelayEvent[] = [];

    for (const list of filteredRegularEvents.values()) {
      filteredEvents.push(list.sortBy((x) => x.event.created_at, 'desc')[0]);
    }

    return filteredEvents;
  }

  #getDIdentifier(tags: string[][]): string | undefined {
    for (const tag of tags) {
      if (tag[0] === 'd') {
        return tag[1];
      }
    }

    return undefined;
  }

  // #endregion

  // #region 30078

  async #fetchAll30078Events(
    name: string,
    fromRelays: string[]
  ): Promise<RelayEvent[]> {
    if (fromRelays.empty()) {
      return [];
    }
    const pubkey = this.conf.connector.conf.pubkey;
    const filters: Filter[] = [
      {
        kinds: [30078 as any],
        authors: [pubkey],
        '#d': [name],
      },
      {
        kinds: [Kind.EventDeletion],
        authors: [pubkey],
        '#a': [`30078:${pubkey}:${name}`],
      },
    ];

    const promises: Promise<RelayEvent[]>[] = [];
    const relays = this.#getRelays(fromRelays);
    relays.forEach((relay) => promises.push(this.#list(relay, filters)));
    const results = await Promise.allSettled(promises);

    const relayEvents: RelayEvent[] = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        continue;
      }
      relayEvents.push(...result.value);
    }

    return relayEvents;
  }

  #filterAll30078Events(
    relayEvents: RelayEvent[]
  ): [Event, string[]] | undefined {
    const dataRelayEvents = relayEvents.filter(
      (x) => x.event.kind === (30078 as any)
    );

    if (dataRelayEvents.empty()) {
      return undefined;
    }

    const deletionRelayEvents = relayEvents.filter(
      (x) => x.event.kind === Kind.EventDeletion
    );

    const mostRecentDeletionEvent = deletionRelayEvents.sortBy(
      (x) => x.event.created_at,
      'desc'
    )[0] as RelayEvent | undefined;

    const validDataRelayEvents = dataRelayEvents
      .filter((x) => {
        if (typeof mostRecentDeletionEvent === 'undefined') {
          return true;
        }

        if (x.event.created_at > mostRecentDeletionEvent.event.created_at) {
          return true;
        }

        return false;
      })
      .sortBy((x) => x.event.created_at, 'desc');

    if (validDataRelayEvents.empty()) {
      return undefined;
    }

    const mostRecentId = validDataRelayEvents[0].event.id;
    const relays = validDataRelayEvents
      .filter((x) => x.event.id === mostRecentId)
      .map((x) => x.url);

    return [validDataRelayEvents[0].event, relays];
  }

  // #endregion 30078

  // #endregion Private Methods
}
