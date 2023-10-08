import { Component } from '@angular/core';
import { EventTemplate } from 'nostr-tools';
import { NostrHelperV3 } from 'src/app/common/nostrHelperV3';
import { MainService } from 'src/app/services/main.service';
import { v4 } from 'uuid';
import { nip05 } from 'nostr-tools';
import { MatDialogRef } from '@angular/material/dialog';

type PubkeyVisibility = 'private' | 'public';

@Component({
  selector: 'app-create-new-people-list',
  templateUrl: './create-new-people-list.component.html',
  styleUrls: ['./create-new-people-list.component.scss'],
})
export class CreateNewPeopleListComponent {
  listName: string | undefined = `My New List ${new Date()
    .toISOString()
    .slice(0, 10)}`;
  toBeAddedString: string | undefined;
  pubkeyVisibility: PubkeyVisibility = 'private';
  uuid1 = v4();
  uuid2 = v4();
  activity = false;

  // pubkey (hex)
  // 'private' | 'public'
  readonly pubkeys = new Map<string, PubkeyVisibility>();

  constructor(
    private _mainService: MainService,
    private _dialogRef: MatDialogRef<CreateNewPeopleListComponent>
  ) {}

  async addPubkey() {
    if (!this.toBeAddedString) {
      return;
    }

    let pubkey: string | undefined;
    try {
      pubkey = NostrHelperV3.getNostrPubkeyObject(
        this.toBeAddedString ?? 'na'
      ).hex;
    } catch (error) {
      // this.pubkey might be a nostr address
      const profile = await nip05.queryProfile(this.toBeAddedString);
      if (!profile) {
        return;
      }

      pubkey = profile.pubkey;
    }

    if (this.pubkeys.has(pubkey)) {
      return;
    }

    this.pubkeys.set(pubkey, this.pubkeyVisibility);
    this.toBeAddedString = undefined;
  }

  onClickDeletePubkey(pubkey: string) {
    this.pubkeys.delete(pubkey);
  }

  async createList() {
    if (
      this.pubkeys.size === 0 ||
      !this.listName ||
      !this._mainService.myPubkey
    ) {
      return;
    }

    this.activity = true;

    try {
      const tags: string[][] = [];
      tags.push(['d', this.listName]);
      const privateTags: string[][] = [];
      let content = '';

      for (const pubkeyData of this.pubkeys) {
        if (pubkeyData[1] === 'public') {
          tags.push(['p', pubkeyData[0]]);
          continue;
        }

        if (pubkeyData[1] === 'private') {
          privateTags.push(['p', pubkeyData[0]]);
        }
      }

      if (privateTags.length > 0) {
        const encryptedContent =
          await this._mainService.nostrManager?.nostrConnector.encrypt(
            JSON.stringify(privateTags)
          );

        if (!encryptedContent) {
          throw new Error('Could not encrypt content.');
        }

        content = encryptedContent;
      }

      const eventTemplate: EventTemplate = {
        kind: 30000 as any,
        tags,
        created_at: Math.floor(Date.now() / 1000),
        content,
      };

      const event =
        await this._mainService.nostrManager?.nostrConnector.signEvent(
          eventTemplate
        );

      if (!event) {
        throw new Error('Could not sign event.');
      }

      const channelId = v4();
      this._mainService.nostrManager?.nostrPubSub.on(
        channelId,
        (eos, relayEvents) => {
          relayEvents.forEach((x) => this._mainService.setPeopleList(x));
          if (eos) {
            this.activity = false;
            this._dialogRef.close();
          }
        }
      );
      this._mainService.publishEventToMyRelays(channelId, event);
    } catch (error) {
      console.log(error);
    }
  }
}
