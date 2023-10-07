import { bech32 } from '@scure/base';
import * as utils from '@noble/curves/abstract/utils';

export type NostrHexObject = {
  represents: string;
  hex: string;
};

export type NostrPubkeyObject = {
  hex: string;
  npub: string;
};

export class NostrHelperV3 {
  // #region Public

  static getNostrPubkeyObject(npubORhex: string): NostrPubkeyObject {
    // 1. Assume we got an npub.
    // Try to generate hex value.
    try {
      const hexObject = this._nSomething2hexObject(npubORhex);
      if (hexObject.represents !== 'npub') {
        throw new Error('The provided string is NOT an npub.');
      }

      // Everything is fine. The provided string IS an npub.
      return {
        hex: hexObject.hex,
        npub: npubORhex,
      };
    } catch (error) {
      // Continue.
    }

    // 2. Assume we got an hex.
    // Try to generate the npub.
    try {
      const npub = NostrHelperV3.pubkey2npub(npubORhex);
      return {
        hex: npubORhex,
        npub,
      };
    } catch (error) {
      // Continue;
    }

    throw new Error('Could not convert the provided string into npub/hex.');
  }

  static pubkey2npub(hex: string): string {
    const data = utils.hexToBytes(hex);
    const words = bech32.toWords(data);
    return bech32.encode('npub', words, 5000);
  }

  static getCreatedAt(time: number | undefined = undefined) {
    if (typeof time === 'undefined') {
      time = Date.now();
    }
    return Math.floor(time / 1000);
  }

  // #endregion Public

  private static _nSomething2hexObject(nSomething: string): NostrHexObject {
    const { prefix, words } = bech32.decode(nSomething, 5000);
    const data = new Uint8Array(bech32.fromWords(words));

    return {
      represents: prefix,
      hex: utils.bytesToHex(data),
    };
  }
}
