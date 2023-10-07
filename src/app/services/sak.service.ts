import { Injectable } from '@angular/core';
import { Relay } from 'nostr-tools';

@Injectable({
  providedIn: 'root',
})
export class SakService {
  /**
   * Remove the trailing "wss://" (or "ws://") from the relay URL.
   */
  getReadableRelayUrl(url: string) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('wss://')) {
      return urlLower.split('wss://')[1];
    }

    return urlLower.split('ws://')[1];
  }
}
