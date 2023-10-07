import { Observable, Subject } from 'rxjs';
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
