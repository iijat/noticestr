import { finishRepostEvent } from 'nostr-tools/lib/nip18';
import { NostrDataObject, NostrDataObjectConfig } from './nostrDataObject';
import { Subject, first, firstValueFrom } from 'rxjs';

export type NostrDataCollectionMeta = {
  name: string;

  /**
   * [tag: string, id: string]
   *
   * Example:
   *
   * [
   *
   *   ["Message ABC", 2576"],
   *
   *   ["Message XYZ", "601"]
   *
   * ]
   */
  items: Array<[string, string]>;
};

export type NostrDataCollectionConfig = NostrDataObjectConfig;

export class NostrDataCollection<
  T
> extends NostrDataObject<NostrDataCollectionMeta> {
  hasLoadedItemsEvent = new Subject();
  get hasLoadedItems(): boolean {
    return this.#hasLoadedItems;
  }

  #hasLoadedItems = false;

  get items(): Map<string, NostrDataObject<T>> {
    if (typeof this.#items === 'undefined') {
      this.#items = new Map<string, NostrDataObject<T>>();
      this.value$.pipe(first()).subscribe((fetchResult) => {
        if (!fetchResult.value) {
          return;
        }

        for (const item of fetchResult.value.items) {
          const conf: NostrDataObjectConfig = {
            name: `${this.conf.name}_${item[1]}`,
            fromRelays: this.conf.fromRelays,
            manager: this.conf.manager,
          };

          this.#items?.set(item[1], new NostrDataObject<T>(conf));
        }
        this.#hasLoadedItems;
        this.hasLoadedItemsEvent.next(null);
      });
    }

    return this.#items;
  }

  #items: Map<string, NostrDataObject<T>> | undefined;

  async addItem(item: T, tag: string) {
    let collection = await firstValueFrom(this.value$);
    if (typeof collection.value === 'undefined') {
      // The collection "is empty" and nothing was ever published.
      // Publish "empty" data.

      const ok = await this.publish({ name: this.conf.name, items: [] });
      if (!ok) {
        throw new Error('Could not publish meta data for empty collection.');
      }
      collection = await firstValueFrom(this.value$);
    }

    if (!collection.value) {
      throw new Error('Unknown error. Should not be possible.');
    }

    const objectId = new Date().getTime().toString();
    const conf: NostrDataCollectionConfig = {
      name: `${this.conf.name}_${objectId}`,
      fromRelays: this.conf.fromRelays,
      manager: this.conf.manager,
    };

    const newItem = new NostrDataObject<T>(conf);
    const publishOk = await newItem.publish(item);
    if (!publishOk) {
      throw new Error('Could not publish item.');
    }

    collection.value.items.push([tag, objectId]);
    const ok = await this.publish();
    if (!ok) {
      throw new Error('Could not publish meta data for updated collection.');
    }
  }
}

// import { Event, Filter, Kind } from 'nostr-tools';
// import { RelayService } from '../services/relay.service';
// import '../common/arrayExtensions';
// import { NostrService } from '../services/nostr.service';

// export class NostrDataCollectionItem<T> {
//   get data(): T | undefined {
//     return this.#data;
//   }
//   #data: T | undefined;

//   constructor(
//     public id: string,
//     public event: Event | null,
//     public app: string,
//     public collectionName: string,
//     public pubkey: string
//   ) {}

//   async decryptContent(nostrService: NostrService) {
//     if (!this.event) {
//       return;
//     }
//     const decryptedContentString = await nostrService.decrypt(
//       this.pubkey,
//       this.event.content
//     );
//     this.#data = JSON.parse(decryptedContentString) as T;
//   }

//   async publishItem(toRelays: string[]) {
//     // TODO
//   }
// }

// export class NostrDataCollection<TItem> {
//   loading = false;

//   get items(): NostrDataCollectionItem<TItem>[] {
//     return this.#items;
//   }

//   get event() {
//     return this.#event;
//   }
//   #event: Event | undefined;

//   #hasLoadedCollection = false;
//   #hasLoadedCollectionItems = false;

//   #items: NostrDataCollectionItem<TItem>[] = [];

//   constructor(public app: string, public name: string, public pubkey: string) {}

//   async loadCollection(
//     fromRelays: string[],
//     relayService: RelayService,
//     nostrService: NostrService
//   ) {
//     this.loading = true;

//     if (this.#hasLoadedCollection) {
//       await this._loadCollectionItems(fromRelays, relayService, nostrService);
//       this.loading = false;
//       return;
//     }

//     const collectionEvents: Event[] = [];
//     const collectionDeletionEvents: Event[] = [];

//     const todoRelays = new Set([...fromRelays]);
//     while (todoRelays.size > 0) {
//       const todoRelay = Array.from(todoRelays)[0];
//       todoRelays.delete(todoRelay);

//       try {
//         const filters: Filter[] = [
//           {
//             kinds: [30078 as any],
//             authors: [this.pubkey],
//             '#d': [this._getDIdentifier()],
//           },
//           {
//             kinds: [Kind.EventDeletion],
//             authors: [this.pubkey],
//             '#a': [`30078:${this.pubkey}:${this.app}_${this.name}`],
//           },
//         ];

//         const eventsFromTodoRelay = await relayService.getEventsByFilter(
//           todoRelay,
//           filters
//         );

//         collectionEvents.push(
//           ...eventsFromTodoRelay.filter((x) => x.kind === (30078 as any))
//         );

//         collectionDeletionEvents.push(
//           ...eventsFromTodoRelay.filter((x) => x.kind === Kind.EventDeletion)
//         );
//       } catch (error) {
//         console.log(error);
//       }
//     }

//     // Consolidate loaded events and deletion events.
//     if (collectionEvents.length === 0) {
//       // No collection data found.
//       this.#hasLoadedCollection = true;
//       this.#hasLoadedCollectionItems = true;
//       this.loading = false;
//       return;
//     }

//     const newestCollectionEvent = collectionEvents.sortBy(
//       (x) => x.created_at,
//       'desc'
//     )[0];
//     if (
//       collectionDeletionEvents.find(
//         (x) => x.created_at > newestCollectionEvent.created_at
//       )
//     ) {
//       // The collection data was marked as deleted.
//       this.#hasLoadedCollection = true;
//       this.#hasLoadedCollectionItems = true;
//       this.loading = false;
//       return;
//     }

//     this.#event = newestCollectionEvent;
//     this.#hasLoadedCollection = true;
//     await this._loadCollectionItems(fromRelays, relayService, nostrService);
//     this.loading = false;
//   }

//   private async _loadCollectionItems(
//     fromRelays: string[],
//     relayService: RelayService,
//     nostrService: NostrService
//   ) {
//     if (this.#hasLoadedCollectionItems || typeof this.event === 'undefined') {
//       return;
//     }

//     const messageIds = await this._decryptContent(nostrService);

//     const itemsEvents: Event[] = [];
//     const itemsDeletionEvents: Event[] = [];

//     const todoRelays = new Set([...fromRelays]);
//     while (todoRelays.size > 0) {
//       const todoRelay = Array.from(todoRelays)[0];
//       todoRelays.delete(todoRelay);

//       try {
//         const filters: Filter[] = [
//           {
//             kinds: [30078 as any],
//             authors: [this.pubkey],
//             '#d': messageIds.map((x) => `${this.app}_${this.name}_${x}`),
//           },
//           {
//             kinds: [Kind.EventDeletion],
//             authors: [this.pubkey],
//             '#a': messageIds.map(
//               (x) => `30078:${this.pubkey}:${this.app}_${this.name}_${x}`
//             ),
//           },
//         ];

//         const eventsFromTodoRelay = await relayService.getEventsByFilter(
//           todoRelay,
//           filters
//         );

//         itemsEvents.push(
//           ...eventsFromTodoRelay.filter((x) => x.kind === (30078 as any))
//         );

//         itemsDeletionEvents.push(
//           ...eventsFromTodoRelay.filter((x) => x.kind === Kind.EventDeletion)
//         );
//       } catch (error) {
//         console.log(error);
//       }
//     }

//     // Sort regular and deletion events by messageId
//     const filteredEvents = this._filterEvents(
//       messageIds,
//       itemsEvents,
//       itemsDeletionEvents
//     );

//     const items: NostrDataCollectionItem<TItem>[] = [];
//     for (const filteredEvent of filteredEvents) {
//       const newItem = new NostrDataCollectionItem<TItem>(
//         filteredEvent[0],
//         filteredEvent[1],
//         this.app,
//         this.name,
//         this.pubkey
//       );
//       try {
//         await newItem.decryptContent(nostrService);
//       } catch (error) {
//         console.log(error);
//       }
//       items.push();
//     }

//     this.#items = items;
//     this.#hasLoadedCollectionItems = true;
//   }

//   async publishCollection(toRelays: string[]) {
//     // TODO
//   }

//   private _getDIdentifier() {
//     return `${this.app}_${this.name}`;
//   }

//   private async _decryptContent(nostrService: NostrService): Promise<string[]> {
//     if (typeof this.event === 'undefined') {
//       return [];
//     }

//     const decryptedContentString = await nostrService.decrypt(
//       this.pubkey,
//       this.event.content
//     );
//     return JSON.parse(decryptedContentString) as string[];
//   }

//   private _filterEvents(
//     messageIds: string[],
//     regularEvents: Event[],
//     deletionEvents: Event[]
//   ): Map<string, Event | null> {
//     // Will hold the latest regular Event
//     const filteredEvents = new Map<string, Event | null>();
//     for (const regularEvent of regularEvents) {
//       for (const tag of regularEvent.tags) {
//         if (tag[0] === 'd') {
//           const messageId = tag[1].split('_')[2];
//           const entry = filteredEvents.get(messageId);
//           if (!entry) {
//             filteredEvents.set(messageId, regularEvent);
//           } else {
//             // Check if this regular event is more recent.
//             // Exchange, if so.
//             if (entry.created_at < regularEvent.created_at) {
//               filteredEvents.set(messageId, regularEvent);
//             }
//           }
//           break;
//         }
//       }
//     }

//     // Consolidate the regularEventsMap by deleting entries
//     // if we find a suitable deletion event.
//     for (const deletionEvent of deletionEvents) {
//       for (const tag of deletionEvent.tags) {
//         if (tag[0] === 'a') {
//           const tagDSplit = tag[1].split('_');
//           const messageId = tagDSplit[tagDSplit.length - 1];
//           const regularEvent = filteredEvents.get(messageId);
//           if (
//             regularEvent &&
//             deletionEvent.created_at > regularEvent.created_at
//           ) {
//             // Nullify.
//             filteredEvents.set(messageId, null);
//           }
//           break;
//         }
//       }
//     }

//     // Now that we have filtered our regular events and made sure that
//     // these do not contain deletion events, we need to check against the
//     // provided list "messageIds".
//     for (const messageId of messageIds) {
//       if (!filteredEvents.has(messageId)) {
//         filteredEvents.set(messageId, null);
//       }
//     }

//     return filteredEvents;
//   }
// }
