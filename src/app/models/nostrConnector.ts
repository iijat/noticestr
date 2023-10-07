import { Event, EventTemplate } from 'nostr-tools';

export type NostrConnectorUse = 'nip-07' | 'nip-46';

export type NostrConnectorConfig = {
  use: NostrConnectorUse;
  pubkey: string;
};

export class NostrConnector {
  get conf() {
    return this.#conf;
  }

  #conf: NostrConnectorConfig;

  constructor(conf: NostrConnectorConfig) {
    this.#conf = conf;
  }

  updateUse(newUse: NostrConnectorUse) {
    this.#conf.use = newUse;
  }

  static async getPublicKey(use: NostrConnectorUse): Promise<string> {
    if (use === 'nip-07') {
      const pubkey = await window.nostr?.getPublicKey();
      if (!pubkey) {
        throw new Error('Error retrieving public key.');
      }
      return pubkey;
    }

    throw new Error('Not implemented yet.');
  }

  async getPublicKey(): Promise<string> {
    if (this.conf.use === 'nip-07') {
      const pubkey = await window.nostr?.getPublicKey();
      if (!pubkey) {
        throw new Error('Error retrieving public key.');
      }
      return pubkey;
    }

    throw new Error('Not implemented yet.');
  }

  async signEvent<K extends number = number>(
    eventTemplate: EventTemplate<K>
  ): Promise<Event<K>> {
    if (this.conf.use === 'nip-07') {
      const event = await window.nostr?.signEvent(eventTemplate);
      if (!event) {
        throw new Error('Error signing the event.');
      }

      return event as Event<K>;
    }

    throw new Error('Not implemented yet.');
  }

  async decrypt(cipherText: string): Promise<string> {
    if (this.conf.use === 'nip-07' && window.nostr?.nip04) {
      const plaintext = await window.nostr.nip04.decrypt(
        this.conf.pubkey,
        cipherText
      );
      return plaintext;
    }

    throw new Error('Not implemented yet.');
  }

  async encrypt(plainText: string): Promise<string> {
    if (this.conf.use === 'nip-07' && window.nostr?.nip04) {
      const cipherText = await window.nostr.nip04.encrypt(
        this.conf.pubkey,
        plainText
      );
      return cipherText;
    }

    throw new Error('Not implemented yet.');
  }
}
