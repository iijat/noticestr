import { Injectable } from '@angular/core';
import { NostrService } from './nostr.service';
import { RelayConnection } from '../common/relayConnection';
import { Metadata, MetadataWrapper } from '../common/typeDefs';
import { Event, Filter, Kind } from 'nostr-tools';
import { PeopleListWrapper } from '../common/peopleListWrapper';
import { RelayListWrapper } from '../common/relayListWrapper';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RelayService_OLD {
  readonly connections = new Map<string, RelayConnection>();
  readonly metaWrapper = new Map<string, MetadataWrapper>();
  readonly myPeopleLists = new Map<string, PeopleListWrapper[]>();
  readonly myDeletedPeopleLists: Array<{
    listName: string;
    created_at: number;
    fromRelay: string;
  }> = [];
  get myFilteredPeopleLists(): PeopleListWrapper[] {
    const result: PeopleListWrapper[] = [];
    // for (const wrapper of this.myPeopleLists.get(
    //   this._nostrService.pubkey ?? 'na'
    // ) ?? []) {
    //   if (
    //     !this.myDeletedPeopleLists
    //       .map((x) => x.listName)
    //       .includes(wrapper.listName)
    //   ) {
    //     result.push(wrapper);
    //     continue;
    //   }

    //   const relevantEntries = this.myDeletedPeopleLists.filter(
    //     (x) => x.listName === wrapper.listName
    //   );

    //   if (
    //     relevantEntries
    //       .map((x) => x.created_at)
    //       .every((x) => x < wrapper.relayEvent.created_at)
    //   ) {
    //     // Only add list if all deletion events are older than the last list event.
    //     result.push(wrapper);
    //   }
    // }

    return result;
  }

  readonly relayList = new Map<string, RelayListWrapper>();
  readonly crawledPubkeys = new Set<string>();

  get fallbackRelays(): string[] {
    return this._fallbackRelays;
  }

  get publishRelays(): string[] {
    const myRelayList = this.relayList.get(this._nostrService.pubkey ?? 'na');
    const myWriteRelays =
      myRelayList?.nip65Relays
        .filter((x) => ['read+write', 'write'].includes(x.tag))
        .map((x) => x.url) ?? [];

    const myNip05Relays =
      this.metaWrapper.get(this._nostrService.pubkey ?? 'na')
        ?.confirmedNip05Relays ?? [];

    const relays = Array.from(
      new Set([
        ...(this._initialRelay ? [this._initialRelay] : []),
        ...myWriteRelays,
        ...this.fallbackRelays,
        ...myNip05Relays,
      ])
    );

    return relays;
  }

  public crawledMe = false;
  public crawledMeEvent = new Subject<string[]>();

  private _initialRelay: string | undefined;
  private _fallbackRelays = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nostr-pub.wellorder.net',
    'wss://relay.snort.social',
  ];

  constructor(private _nostrService: NostrService) {}

  async publishEvent(
    event: Event
  ): Promise<Array<{ relay: string; publishOk: boolean }>> {
    const returnValue: Array<{ relay: string; publishOk: boolean }> = [];
    for (const relay of this.publishRelays) {
      try {
        const connection = await this.getConnection(relay, true);
        connection.publish(event);
        console.log(`Event published on '${relay}'`);
        returnValue.push({ relay, publishOk: true });
      } catch (error) {
        console.log(`Error publishing event on '${relay}'`);
        returnValue.push({ relay, publishOk: false });
      }
    }

    return returnValue;
  }

  async getConnection(
    relay: string,
    goOnline = false
  ): Promise<RelayConnection> {
    let connection = this.connections.get(relay);
    if (!connection) {
      connection = new RelayConnection(relay, this._nostrService);
      this.connections.set(relay, connection);
    }

    if (goOnline) {
      await connection.goOnline();
    }

    return connection;
  }

  /** Sets the metadata if it is more recent. */
  setMetadata(event: Event): boolean {
    // if (event.kind !== Kind.Metadata) {
    //   return false;
    // }

    // const metaWrapper = this.metaWrapper.get(event.pubkey);
    // if (!metaWrapper) {
    //   this.metaWrapper.set(event.pubkey, new MetadataWrapper(event));
    //   return true;
    // }

    // // Only set, if the data is more recent.
    // if (event.created_at > metaWrapper.relayEvent.created_at) {
    //   this.metaWrapper.set(event.pubkey, new MetadataWrapper(event));
    //   return true;
    // }

    return false;
  }

  setPeopleList(event: Event, fromRelay: string): boolean {
    // if (event.kind !== (30000 as any)) {
    //   return false;
    // }

    // const lists = this.myPeopleLists.get(event.pubkey);
    // if (typeof lists === 'undefined') {
    //   this.myPeopleLists.set(event.pubkey, [
    //     new PeopleListWrapper(event, fromRelay, this._nostrService),
    //   ]);
    //   return true;
    // }

    // const eventListName = this._getPeopleListName(event);
    // let exchangeIndex: number | undefined;
    // let add = true; // assume we have to add a new list
    // for (let i = 0; i < lists.length; i++) {
    //   const listName = this._getPeopleListName(lists[i].relayEvent);

    //   if (listName !== eventListName) {
    //     continue;
    //   }

    //   // We have a list with the same name.
    //   add = false;
    //   if (event.created_at > lists[i].relayEvent.created_at) {
    //     // The new list is more recent.
    //     exchangeIndex = i;
    //   }
    //   break;
    // }

    // if (add) {
    //   lists.push(new PeopleListWrapper(event, fromRelay, this._nostrService));
    //   return true;
    // }

    // if (!exchangeIndex) {
    //   return false;
    // }

    // // Exchange
    // lists.splice(
    //   exchangeIndex,
    //   1,
    //   new PeopleListWrapper(event, fromRelay, this._nostrService)
    // );
    return true;
  }

  // setRelayList(event: Event): boolean {
  //   if (event.kind !== Kind.RelayList) {
  //     return false;
  //   }

  //   const list = this.relayList.get(event.pubkey);
  //   if (!list) {
  //     this.relayList.set(event.pubkey, new RelayListWrapper(event));
  //     return true;
  //   }

  //   // Only set, if the data is more recent.
  //   if (event.created_at > list.relayEvent.created_at) {
  //     this.relayList.set(event.pubkey, new RelayListWrapper(event));
  //     return true;
  //   }

  //   return false;
  // }

  async crawlMe(pubkey: string, initialRelay: string | null) {
    await this.crawl(pubkey, initialRelay, true);
    this.crawledMe = true;
    this.crawledMeEvent.next(this.publishRelays);
  }

  async crawl(pubkey: string, initialRelay: string | null, my: boolean) {
    if (initialRelay && !this._initialRelay) {
      this._initialRelay = initialRelay;
    }

    if (this.crawledPubkeys.has(pubkey)) {
      return;
    }

    this.crawledPubkeys.add(pubkey);

    let kinds: Kind[] = [];

    if (my) {
      kinds = [Kind.Metadata, Kind.RelayList, 30000 as any, Kind.EventDeletion];
    } else {
      kinds = [Kind.Metadata, Kind.RelayList];
    }

    const processedRelays = new Set<string>();
    const todoRelays = new Set<string>([...this._fallbackRelays]);
    if (this._initialRelay) {
      todoRelays.add(this._initialRelay);
    }

    while (todoRelays.size > 0) {
      // Get 1st entry
      const todoRelay = Array.from(todoRelays)[0];
      todoRelays.delete(todoRelay);

      try {
        console.log('Handling relay ' + todoRelay + ' for pubkey ' + pubkey);

        const eventsFromTodoRelay = await this.getEvents(
          pubkey,
          kinds,
          todoRelay
        );
        processedRelays.add(todoRelay);

        const relevantEvents = this._processEvents(
          eventsFromTodoRelay,
          todoRelay
        );

        const relevantNewRelays = await this._getRelevantRelays(
          relevantEvents,
          Array.from(processedRelays)
        );

        relevantNewRelays.forEach((x) => todoRelays.add(x));
      } catch (error) {
        console.log(error);
        console.log('HALLO');
        // do nothing
      }
    }
  }

  async getEvents(pubkey: string, kinds: Kind[], relay: string) {
    const connection = await this.getConnection(relay, true);
    const events = await connection.sub([
      {
        kinds,
        authors: [pubkey],
      },
    ]);
    return events;
  }

  async getEventsByFilter(relay: string, filters: Filter[]) {
    const connection = await this.getConnection(relay, true);
    const events = await connection.sub(filters);
    return events;
  }

  /** Store or update events. Return a list of events that are new or were updated. */
  private _processEvents(events: Event[], fromRelay: string) {
    // const addedOrUpdatedEvents: Event[] = [];

    // for (const event of events) {
    //   if (event.kind === Kind.Metadata) {
    //     const relevant = this.setMetadata(event);
    //     if (relevant) {
    //       addedOrUpdatedEvents.push(event);
    //     }
    //   } else if (event.kind === (30000 as any)) {
    //     const relevant = this.setPeopleList(event, fromRelay);
    //     if (relevant) {
    //       addedOrUpdatedEvents.push(event);
    //     }
    //   } else if (event.kind === Kind.RelayList) {
    //     const relevant = this.setRelayList(event);
    //     if (relevant) {
    //       addedOrUpdatedEvents.push(event);
    //     }
    //   } else if (event.kind === Kind.EventDeletion) {
    //     for (const tag of event.tags) {
    //       if (tag[0] !== 'a') {
    //         continue;
    //       }

    //       const [kind, pubkey, d] = tag[1].split(':');

    //       if (kind != '30000') {
    //         continue;
    //       }

    //       if (pubkey !== this._nostrService.pubkey) {
    //         continue;
    //       }

    //       if (
    //         !this.myDeletedPeopleLists.find(
    //           (x) => x.listName === d && x.created_at === event.created_at
    //         )
    //       ) {
    //         this.myDeletedPeopleLists.push({
    //           listName: d,
    //           created_at: event.created_at,
    //           fromRelay,
    //         });
    //       }
    //     }
    //   }
    // }

    return []; //addedOrUpdatedEvents;
  }

  private async _getRelevantRelays(
    events: Event[],
    alreadyProcessedRelays: string[]
  ): Promise<string[]> {
    const relevantRelays = new Set<string>();

    // Handle relays from a new or updated Kind 0 (metadata) event.
    const kind0Event = events.find((x) => x.kind === Kind.Metadata);
    if (kind0Event) {
      const meta = this.metaWrapper.get(kind0Event.pubkey);
      if (meta) {
        await meta.evaluateNip05();
        meta.confirmedNip05Relays.forEach((x) => {
          if (!alreadyProcessedRelays.includes(x)) {
            relevantRelays.add(x);
          }
        });
      }
    }

    // Handle relays from a new or updated kind 10002 event.
    // TODO

    return Array.from(relevantRelays);
  }

  private _getPeopleListName(event: Event): string | undefined {
    if (event.kind !== (30000 as any)) {
      return undefined;
    }

    for (const tag of event.tags) {
      if (tag[0] === 'd') {
        return tag[1];
      }
    }

    return undefined;
  }
}
