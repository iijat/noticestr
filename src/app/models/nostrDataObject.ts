import { Observable, Subject, firstValueFrom } from 'rxjs';
import { FetchResult } from './nostrRelayer';
import { Event } from 'nostr-tools';
import { NostrManager } from './nostrManager';

export type NostrDataObjectConfig = {
  manager: NostrManager;
  name: string;
  fromRelays: string[];
};

export class NostrDataObject<T> {
  get value$(): Observable<FetchResult<T>> {
    if (!this.#value) {
      this.#value = this.#generateObservable();
    }

    return this.#value;
  }

  #value: Observable<FetchResult<T>> | undefined;

  #fetchResult: FetchResult<T> | undefined;

  constructor(public conf: NostrDataObjectConfig) {}

  refetch() {
    this.#value = this.#generateObservable();
  }

  /**
   * Publish etched and after that changed data or
   * publish completely new data.
   */
  async publish(data: T | undefined = undefined): Promise<boolean> {
    const publishNew = typeof data !== 'undefined';

    if (!publishNew) {
      const result = await firstValueFrom(this.value$);
      if (!result.value || !this.#fetchResult) {
        throw new Error('No existing data exists that can be published.');
      }

      const publishEvents =
        await this.conf.manager.nostrRelayer.publish30078Data<T>(
          result.value,
          this.conf.name,
          this.conf.fromRelays
        );

      if (publishEvents.empty()) {
        return false;
      }

      this.#fetchResult.event = publishEvents[0].event;
    } else {
      // Publish new data.
      const publishEvents =
        await this.conf.manager.nostrRelayer.publish30078Data<T>(
          data,
          this.conf.name,
          this.conf.fromRelays
        );

      if (publishEvents.empty()) {
        return false;
      }

      this.#fetchResult = {
        value: data,
        fromRelays: this.conf.fromRelays,
        event: publishEvents[0].event,
        foundOnRelays: Array.from(new Set(publishEvents.map((x) => x.url))),
      };
    }

    return true;
  }

  #generateObservable() {
    return new Observable<FetchResult<T>>((subscriber) => {
      if (typeof this.#fetchResult !== 'undefined') {
        subscriber.next(this.#fetchResult);
        subscriber.complete();
        return;
      }

      this.conf.manager.nostrRelayer
        .fetch30078Data<T>(this.conf.name, this.conf.fromRelays)
        .then((result: FetchResult<T>) => {
          this.#fetchResult = result;

          subscriber.next(result);

          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }
}

// class NostrDataColletion<T> {
//   items: NostrDataObject<T>[];

//   constructor(public name: string, public pubkey: string) {}
// }
