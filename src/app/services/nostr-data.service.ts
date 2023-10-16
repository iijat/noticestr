import { Injectable } from '@angular/core';
import {
  NostrDataCollection,
  NostrDataCollectionConfig,
} from '../models/nostrDataCollection';
import { NoticeStrMessage } from '../models/noticeStr';
import { NostrManager } from '../models/nostrManager';

@Injectable({
  providedIn: 'root',
})
export class NostrDataService {
  get messages() {
    if (!this.#isInitialized) {
      throw new Error(this.#notInitializedErrorMessage);
    }
    return this.#messages;
  }

  #prefix = 'noticestr';
  #notInitializedErrorMessage = `Please call the method 'initialize' first.`;
  #isInitialized = false;
  #messages: NostrDataCollection<NoticeStrMessage> | undefined;

  //constructor() {}

  initialize(storageRelays: string[], manager: NostrManager) {
    if (this.#isInitialized) {
      return;
    }

    this.#initializeMessages(storageRelays, manager);

    this.#isInitialized = true;
  }

  #initializeMessages(storageRelays: string[], manager: NostrManager) {
    const conf: NostrDataCollectionConfig = {
      name: `${this.#prefix}_messages`,
      fromRelays: storageRelays,
      manager,
    };

    this.#messages = new NostrDataCollection(conf);
  }
}
