import { Injectable } from '@angular/core';
import { NostrConnectorUse } from '../models/nostrConnector';
import { LOCAL_STORAGE } from '../common/localstorage';
import { NostrManager } from '../models/nostrManager';
import { Event, Kind } from 'nostr-tools';
import { RelayListWrapper } from '../common/relayListWrapper';
import { MetadataWrapper } from '../common/typeDefs';
import { RelayEvent } from '../models/nostrRelayer';
import { PeopleListWrapper } from '../common/peopleListWrapper';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';
import { TypeModifier } from '@angular/compiler';
import { PubsubService } from './pubsub.service';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  readonly metadata = new Map<string, MetadataWrapper>();
  readonly relayList = new Map<string, RelayListWrapper>();
  readonly peopleLists = new Map<string, PeopleListWrapper[]>();

  get myPubkey(): string | undefined {
    if (!this.#myPubkey) {
      return localStorage.getItem(LOCAL_STORAGE.MY_PUBKEY) ?? undefined;
    }

    return this.#myPubkey;
  }

  get myNostrConnectorUse(): NostrConnectorUse | undefined {
    if (!this.#myNostrConnectorUse) {
      return (
        (localStorage.getItem(LOCAL_STORAGE.GO_WITH) as NostrConnectorUse) ??
        undefined
      );
    }

    return this.#myNostrConnectorUse;
  }

  get myInitialRelay(): string | undefined {
    if (!this.#myInitialRelay) {
      return localStorage.getItem(LOCAL_STORAGE.INITIAL_RELAY) ?? undefined;
    }

    return this.#myInitialRelay;
  }

  get myRelays(): string[] {
    const relays = [...this.#fallbackRelays];
    if (this.myInitialRelay) {
      relays.push(this.myInitialRelay);
    }

    return relays;
  }

  get nostrManager(): NostrManager | undefined {
    return this.#nostrManager;
  }

  #myPubkey: string | undefined;
  #myNostrConnectorUse: NostrConnectorUse | undefined;
  #myInitialRelay: string | undefined;
  #nostrManager: NostrManager | undefined;
  #fallbackRelays = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nostr-pub.wellorder.net',
    'wss://relay.snort.social',
  ];

  //#fallbackRelays = [];

  // ws://debian:4848

  setMyPubkey(pubkey: string) {
    this.#myPubkey = pubkey;
    localStorage.setItem(LOCAL_STORAGE.MY_PUBKEY, pubkey);
  }

  setMyNostrConnectorUse(use: NostrConnectorUse) {
    this.#myNostrConnectorUse = use;
    localStorage.setItem(LOCAL_STORAGE.GO_WITH, use);
  }

  setMyInitialRelay(relay: string) {
    this.#myInitialRelay = relay;
    localStorage.setItem(LOCAL_STORAGE.INITIAL_RELAY, relay);
  }

  setNostrManager(manager: NostrManager) {
    this.#nostrManager = manager;
  }

  /**
   * Fetches Metadata and RelayList for a given pubkey.
   */
  async fetchInfoAbout(pubkey: string): Promise<void> {
    if (!this.nostrManager) {
      return;
    }

    const kinds = [Kind.Metadata, Kind.RelayList];
    const fromRelays: string[] = [...this.#fallbackRelays];

    if (this.myInitialRelay) {
      fromRelays.push(this.myInitialRelay);
    }

    const channelId = v4();
    this.nostrManager?.nostrPubSub.on(
      channelId,
      (eos: boolean, relayEvents: RelayEvent[]) => {
        relayEvents.forEach((x) => {
          this.#setMetadata(x);
          this.#setRelayList(x);
        });
      }
    );

    this.nostrManager.nostrRelayer.fetchReplaceableEvents(
      channelId,
      pubkey,
      kinds,
      fromRelays
    );
  }

  async fetchPeopleLists(
    pubkey: string,
    finished?: () => void
  ): Promise<PeopleListWrapper[] | undefined> {
    const fromRelays: string[] = [...this.#fallbackRelays];

    if (this.myInitialRelay) {
      fromRelays.push(this.myInitialRelay);
    }

    // Make sure that a peopleLists (even empty) exists.
    let peopleLists = this.peopleLists.get(pubkey);
    if (typeof peopleLists === 'undefined') {
      peopleLists = [];
      this.peopleLists.set(pubkey, peopleLists);
    }

    const channelId = v4();
    this.nostrManager?.nostrPubSub.on(
      channelId,
      (eos: boolean, relayEvents: RelayEvent[]) => {
        for (const relayEvent of relayEvents) {
          // Ignore events that already have a cached deletion.
          if (this.nostrManager?.nostrRelayer.cache.isDeleted(relayEvent)) {
            console.log('Ignoring event due to cached deletion events.');
            continue;
          }
          this.setPeopleList(relayEvent);
        }

        //relayEvents.forEach((x) => this.setPeopleList(x));
        if (eos && typeof finished !== 'undefined') {
          finished();
        }
      }
    );

    this.nostrManager?.nostrRelayer.fetchParameterizedReplaceableEvents(
      channelId,
      pubkey,
      [30000 as any],
      fromRelays
    );

    return peopleLists;
  }

  publishEventToMyRelays(channelId: string, event: Event) {
    const toRelays: string[] = [...this.#fallbackRelays];

    if (this.myInitialRelay) {
      toRelays.push(this.myInitialRelay);
    }

    const internalChannelId = v4();
    this.nostrManager?.nostrPubSub.on(internalChannelId, (eos, relayEvents) => {
      this.nostrManager?.nostrPubSub.emitAsync(channelId, eos, relayEvents);
    });

    this.nostrManager?.nostrRelayer.publishEvent(
      internalChannelId,
      event,
      toRelays
    );
  }

  #setMetadata(relayEvent: RelayEvent): boolean {
    // The relay could either be a regular kind 0 event (metadata)
    // or a deletion event for it (kind 5).

    if (
      relayEvent.event.kind !== Kind.Metadata &&
      relayEvent.event.kind !== Kind.EventDeletion
    ) {
      return false;
    }

    const metadata = this.metadata.get(relayEvent.event.pubkey);
    if (relayEvent.event.kind == Kind.Metadata) {
      if (!metadata) {
        this.metadata.set(
          relayEvent.event.pubkey,
          new MetadataWrapper(relayEvent)
        );
        return true;
      }

      // Only set, if the data is more recent.
      if (relayEvent.event.created_at > metadata.relayEvent.event.created_at) {
        this.metadata.set(
          relayEvent.event.pubkey,
          new MetadataWrapper(relayEvent)
        );
        return true;
      }

      return false;
    }

    // Deletion event.
    if (!metadata) {
      return false;
    }

    const deletionEventIds: string[] = [];
    for (const tag of relayEvent.event.tags) {
      if (tag[0] === 'e') {
        deletionEventIds.push(tag[1]);
      }
    }

    if (deletionEventIds.includes(metadata.relayEvent.event.id)) {
      this.metadata.delete(relayEvent.event.pubkey);
      return true;
    }
    return false;
  }

  #setRelayList(relayEvent: RelayEvent): boolean {
    if (relayEvent.event.kind !== Kind.RelayList) {
      return false;
    }

    const list = this.relayList.get(relayEvent.event.pubkey);
    if (!list) {
      this.relayList.set(
        relayEvent.event.pubkey,
        new RelayListWrapper(relayEvent)
      );
      return true;
    }

    // Only set, if the data is more recent.
    if (relayEvent.event.created_at > list.relayEvent.event.created_at) {
      this.relayList.set(
        relayEvent.event.pubkey,
        new RelayListWrapper(relayEvent)
      );
      return true;
    }

    return false;
  }

  setPeopleList(relayEvent: RelayEvent): boolean {
    if (![30000 as any, Kind.EventDeletion].includes(relayEvent.event.kind)) {
      return false;
    }

    const getDIdentifier = function (tags: string[][]) {
      for (const tag of tags) {
        if (tag[0] === 'd') {
          return tag[1];
        }
      }

      return undefined;
    };

    const lists = this.peopleLists.get(relayEvent.event.pubkey);
    if (relayEvent.event.kind === (30000 as any)) {
      // Regular event.
      if (typeof lists === 'undefined') {
        this.peopleLists.set(relayEvent.event.pubkey, [
          new PeopleListWrapper(relayEvent, this.nostrManager),
        ]);
        return true;
      }

      const eventListName = getDIdentifier(relayEvent.event.tags);
      let exchangeIndex: number | undefined;
      let add = true; // assume we have to add a new list
      for (let i = 0; i < lists.length; i++) {
        const listName = getDIdentifier(lists[i].relayEvent.event.tags);

        if (listName !== eventListName) {
          continue;
        }

        // We have a list with the same name.
        add = false;
        if (
          relayEvent.event.created_at > lists[i].relayEvent.event.created_at
        ) {
          // The new list is more recent.
          exchangeIndex = i;
        }
        break;
      }

      if (add) {
        lists.push(new PeopleListWrapper(relayEvent, this.nostrManager));
        return true;
      }

      if (!exchangeIndex) {
        return false;
      }

      // Exchange
      lists.splice(
        exchangeIndex,
        1,
        new PeopleListWrapper(relayEvent, this.nostrManager)
      );
    }

    // Deletion event. Could hold more than one list identifier.
    if (typeof lists === 'undefined') {
      this.peopleLists.set(relayEvent.event.pubkey, []);
      return false;
    }

    const deletionListNames = new Set<string>();
    for (const tag of relayEvent.event.tags) {
      if (
        tag[0] === 'a' &&
        tag[1].includes(`30000:${relayEvent.event.pubkey}`)
      ) {
        deletionListNames.add(tag[1].split(':')[2]);
      }
    }

    let hasDeletedSomething = false;
    while (deletionListNames.size > 0) {
      const toBeDeletedListName = Array.from(deletionListNames)[0];
      deletionListNames.delete(toBeDeletedListName);

      let deletionIndex = -1;
      for (let i = 1; i < lists.length; i++) {
        if (
          lists[i].listName === toBeDeletedListName &&
          relayEvent.event.created_at > lists[i].relayEvent.event.created_at
        ) {
          deletionIndex = i;
          break;
        }
      }
      if (deletionIndex !== -1) {
        console.log(`Deleted people list '${toBeDeletedListName}'`);
        lists.splice(deletionIndex, 1);
        hasDeletedSomething = true;
      }
    }

    return hasDeletedSomething;
  }
}
