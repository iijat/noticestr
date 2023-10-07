import { NostrConnector, NostrConnectorUse } from './nostrConnector';
import { NostrPubSub } from './nostrPubSub';
import { NostrRelayer } from './nostrRelayer';

export type NostrManagerConfig = {
  pubkey: string;
  use: NostrConnectorUse;
};

export class NostrManager {
  get nostrConnector(): NostrConnector {
    return this.#nostrConnector;
  }

  get nostrRelayer(): NostrRelayer {
    return this.#nostrRelayer;
  }

  readonly nostrPubSub: NostrPubSub;

  #nostrConnector: NostrConnector;
  #nostrRelayer: NostrRelayer;

  constructor(public conf: NostrManagerConfig) {
    this.nostrPubSub = new NostrPubSub();

    const connector = (this.#nostrConnector = new NostrConnector({
      pubkey: conf.pubkey,
      use: conf.use,
    }));

    this.#nostrRelayer = new NostrRelayer(
      {
        connector,
      },
      this.nostrPubSub
    );
  }
}
