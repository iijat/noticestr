import { Event, EventTemplate } from 'nostr-tools';

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: EventTemplate) => Promise<Event>;
      nip04?: {
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
      };
    };
  }
}
