import { Component } from '@angular/core';
import { nip05 } from 'nostr-tools';
import { NostrHelperV3 } from 'src/app/common/nostrHelperV3';
import { NoticeStrMessage } from 'src/app/models/noticeStr';
import { MainService } from 'src/app/services/main.service';
import { NostrDataService } from 'src/app/services/nostr-data.service';

class ToObject {
  pubkey: string;
  nip05?: string;

  get destination() {
    return this.nip05 ?? this.pubkey;
  }

  constructor({
    pubkey,
    nip05,
  }: {
    pubkey: string;
    nip05: string | undefined;
  }) {
    this.pubkey = pubkey;
    this.nip05 = nip05;
  }
}

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss'],
})
export class NewMessageComponent {
  readonly toObjects: ToObject[] = [];
  to: string | undefined;
  subject = '';
  message: string | undefined = '';
  get canSend(): boolean {
    return !this.toObjects.empty() && !!this.subject && !!this.message;
  }

  constructor(
    public mainService: MainService,
    private _nostrDataService: NostrDataService
  ) {}

  async send() {
    const message: NoticeStrMessage = {
      version: 1,
      subject: this.subject,
      message: this.message,
      createdAt: Date.now(),
      recipients: [],
    };

    for (const toObject of this.toObjects) {
      const recipient = {
        pubkey: toObject.pubkey,
        nip05: toObject.nip05 ?? null,
        sendRelays: ['will be overwritten'],
        sendOkRelays: [],
        sendFailedRelays: [],
      };

      const sendRelays: string[] = [];
      const relayList = this.mainService.relayList.get(toObject.pubkey);
      relayList?.nip65Relays.forEach((x) => {
        if (x.tag === 'read' || x.tag === 'read+write') {
          sendRelays.push(x.url.toLowerCase());
        }
      });

      sendRelays.push(...this.mainService.fallbackRelays);
      recipient.sendRelays = Array.from(new Set(sendRelays));

      message.recipients.push(recipient);
    }

    console.log(message);

    const result = await this._nostrDataService.messages?.addItem(
      message,
      message.subject
    );
    console.log(result);
  }

  removeTo(pubkey: string) {
    const index = this.toObjects.findIndex((x) => x.pubkey === pubkey);
    if (index === -1) {
      return;
    }

    this.toObjects.splice(index, 1);
  }

  async applyTo() {
    if (!this.to) {
      return;
    }

    let pubkey: string | undefined;
    let nostrAddress: string | undefined;
    try {
      pubkey = NostrHelperV3.getNostrPubkeyObject(this.to).hex;
    } catch (error) {
      // this.pubkey might be a nostr address
      const profile = await nip05.queryProfile(this.to);
      if (!profile) {
        return;
      }

      pubkey = profile.pubkey;
      nostrAddress = this.to;
    }

    if (!this.toObjects.find((x) => x.pubkey === pubkey)) {
      this.toObjects.push(new ToObject({ pubkey, nip05: nostrAddress }));
      this.mainService.fetchInfoAbout(pubkey);
    }

    this.to = undefined;
  }

  autoresize(event: Event) {
    const element = event.target as HTMLElement;

    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }

  test() {
    this.toObjects.push(
      ...[
        // new ToObject({
        //   pubkey:
        //     'npub1wpsrnvmv5ajxln2jz9vq4wsmew98tyzvkj4pd7sj6wulm3946phqu8m900',
        //   nip05: undefined
        // }),
        new ToObject({
          pubkey:
            '2b2dd85f84dcbff260a110da0c8c62bd1fdfc0a0becb6390ebf3b17d5e4d1f79',
          nip05: undefined,
        }),
        new ToObject({
          pubkey:
            '090e4e48e07e331b7a9eb527532794969ab1086ddfa4d805fff88c6358e9d15d',
          nip05: 'chris@nip05.social',
        }),
        new ToObject({
          pubkey:
            '9b0d19ebfbddc17922a0cd8df1d97e73d8ba106fc80a4d43b3f815f3f1a08983',
          nip05: undefined,
        }),
      ]
    );
    this.mainService.fetchInfoAbout(
      '2b2dd85f84dcbff260a110da0c8c62bd1fdfc0a0becb6390ebf3b17d5e4d1f79'
    );
    this.mainService.fetchInfoAbout(
      '090e4e48e07e331b7a9eb527532794969ab1086ddfa4d805fff88c6358e9d15d'
    );

    this.mainService.fetchInfoAbout(
      '9b0d19ebfbddc17922a0cd8df1d97e73d8ba106fc80a4d43b3f815f3f1a08983'
    );
  }
}
