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
  messages: NostrDataCollection<NoticeStrMessage> | undefined;

  #prefix = 'noticestr';
  #isInitialized = false;

  //constructor() {}

  initialize(storageRelays: string[], manager: NostrManager) {
    this.#initializeMessages(storageRelays, manager);

    this.#isInitialized = true;
  }

  #initializeMessages(storageRelays: string[], manager: NostrManager) {
    const conf: NostrDataCollectionConfig = {
      name: `${this.#prefix}_messages`,
      fromRelays: storageRelays,
      manager,
    };

    this.messages = new NostrDataCollection(conf);
  }
}
