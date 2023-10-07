import { Kind } from 'nostr-tools';
import { RelayEvent } from './nostrRelayer';
import { LOCAL_STORAGE } from '../common/localstorage';

export class NostrEventCache {
  readonly events = new Map<string, RelayEvent[]>();
  readonly deletionEvents = new Map<string, RelayEvent[]>();

  constructor() {
    this.#unpersistDeletionEvents();
  }

  cacheEvents(relayEvents: RelayEvent[]) {
    relayEvents.forEach((x) => this.cacheEvent(x));
  }

  cacheEvent(relayEvent: RelayEvent): boolean {
    if (relayEvent.event.kind === Kind.EventDeletion) {
      return this.#cacheDeletionEvent(relayEvent);
    }

    return this.#cacheRegularEvent(relayEvent);
  }

  printCache() {
    console.log(this.events);
    console.log(this.deletionEvents);
  }

  persistDeletionEvents() {
    localStorage.setItem(
      LOCAL_STORAGE.DELETION_RELAY_EVENTS,
      JSON.stringify(Array.from(this.deletionEvents.values()))
    );
  }

  isDeleted(relayEvent: RelayEvent): boolean {
    const kind = relayEvent.event.kind;
    if (relayEvent.event.kind === Kind.EventDeletion) {
      return false;
    }

    if ([0, 3].includes(kind) || (kind >= 10000 && kind < 20000)) {
      // Replaceable Event
      // <kind>:<pubkey>

      for (const cachedDeletionEventMap of this.deletionEvents) {
        const cachedDeletionEvent = cachedDeletionEventMap[1][0];
        for (const tag of cachedDeletionEvent.event.tags) {
          if (tag[0] === 'e' && tag[1].includes(relayEvent.event.id)) {
            return true;
          }

          if (
            tag[0] === 'a' &&
            tag[1].includes(`${kind}:${relayEvent.event.pubkey}`) &&
            cachedDeletionEvent.event.created_at > relayEvent.event.created_at
          ) {
            return true;
          }
        }
      }
    }

    if (kind >= 30000 && kind < 40000) {
      //Parameterized Replaceable Event
      // <kind>:<pubke<>:<d-tag>

      let dTag = 'unknown';
      for (const tag of relayEvent.event.tags) {
        if (tag[0] === 'd') {
          dTag = tag[1];
        }
      }

      for (const cachedDeletionEventMap of this.deletionEvents) {
        const cachedDeletionEvent = cachedDeletionEventMap[1][0];
        for (const tag of cachedDeletionEvent.event.tags) {
          if (tag[0] === 'e' && tag[1].includes(relayEvent.event.id)) {
            return true;
          }

          if (
            tag[0] === 'a' &&
            tag[1].includes(`${kind}:${relayEvent.event.pubkey}:${dTag}`) &&
            cachedDeletionEvent.event.created_at > relayEvent.event.created_at
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  #unpersistDeletionEvents() {
    const aString = localStorage.getItem(LOCAL_STORAGE.DELETION_RELAY_EVENTS);
    if (!aString) {
      return;
    }

    const deletionEventsArray = JSON.parse(aString) as RelayEvent[][];
    for (const relayEvents of deletionEventsArray) {
      const id = relayEvents[0].event.id;
      let deletionEvent = this.deletionEvents.get(id);
      if (typeof deletionEvent === 'undefined') {
        deletionEvent = [];
        this.deletionEvents.set(id, deletionEvent);
      }

      for (const relayEvent of relayEvents) {
        if (deletionEvent.map((x) => x.url).includes(relayEvent.url)) {
          continue;
        }

        deletionEvent.push(relayEvent);
      }
    }
  }

  #cacheDeletionEvent(relayEvent: RelayEvent): boolean {
    if (relayEvent.event.kind !== Kind.EventDeletion) {
      return false;
    }

    let details = this.deletionEvents.get(relayEvent.event.id);
    if (typeof details === 'undefined') {
      details = [relayEvent];
      this.deletionEvents.set(relayEvent.event.id, details);
      return true;
    }

    if (details.find((x) => x.url === relayEvent.url)) {
      return false;
    }

    details.push(relayEvent);
    return true;
  }

  #cacheRegularEvent(relayEvent: RelayEvent): boolean {
    if (relayEvent.event.kind === Kind.EventDeletion) {
      return false;
    }

    let details = this.events.get(relayEvent.event.id);
    if (typeof details === 'undefined') {
      details = [relayEvent];
      this.events.set(relayEvent.event.id, details);
      return true;
    }

    if (details.find((x) => x.url === relayEvent.url)) {
      return false;
    }

    details.push(relayEvent);
    return true;
  }
}
