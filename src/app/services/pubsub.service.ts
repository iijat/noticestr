import { Injectable } from '@angular/core';
import EventEmitter from 'events';
import { RelayEvent } from '../models/nostrRelayer';

@Injectable({
  providedIn: 'root',
})
export class PubsubService {
  // #engine = new Map<string, EventEmitter>();
  // //constructor() {}
  // on(
  //   channelId: string,
  //   listener: (eos: boolean, relayEvents: RelayEvent[]) => void
  // ): void {
  //   if (this.#engine.has(channelId)) {
  //     return;
  //   }
  //   const emitter = new EventEmitter();
  //   this.#engine.set(channelId, emitter);
  //   emitter.on(channelId, listener);
  // }
  // off(channelId: string) {
  //   const emitter = this.#engine.get(channelId);
  //   if (!emitter) {
  //     return;
  //   }
  //   emitter.removeAllListeners();
  //   this.#engine.delete(channelId);
  // }
  // async emitAsync(channelId: string, eos: boolean, relayEvents: RelayEvent[]) {
  //   const engine = this.#engine.get(channelId);
  //   if (!engine) {
  //     throw new Error(`No engine found for channelId '${channelId}'`);
  //   }
  //   engine.emit(channelId, eos, relayEvents);
  //   if (eos) {
  //     engine.removeAllListeners();
  //     this.#engine.delete(channelId);
  //   }
  // }
}
