import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventTemplate, nip05 } from 'nostr-tools';
import { NostrHelperV3 } from 'src/app/common/nostrHelperV3';
import { PeopleListWrapper } from 'src/app/common/peopleListWrapper';
import { MainService } from 'src/app/services/main.service';
import { v4 } from 'uuid';

type PubkeyVisibility = 'private' | 'public';

export type EditPeopleListDialogData = {
  list: PeopleListWrapper;
};

@Component({
  selector: 'app-edit-people-list-dialog',
  templateUrl: './edit-people-list-dialog.component.html',
  styleUrls: ['./edit-people-list-dialog.component.scss'],
})
export class EditPeopleListDialogComponent implements OnInit {
  readonly uuid1 = v4();
  activity = false;
  toBeAddedString: string | undefined;
  pubkeyVisibility: PubkeyVisibility = 'private';

  constructor(
    private _dialogRef: MatDialogRef<EditPeopleListDialogComponent>,
    private _mainService: MainService,
    @Inject(MAT_DIALOG_DATA) public data: EditPeopleListDialogData
  ) {}

  ngOnInit(): void {
    console.log(this.data);
  }

  async publish() {
    try {
      this.activity = true;

      const tags: string[][] = [];
      tags.push(['d', this.data.list.listName]);
      const privateTags: string[][] = [];
      let content = '';

      for (const publicPubkey of this.data.list.unsafedPublicPubkeys ??
        this.data.list.publicPubkeys) {
        tags.push(['p', publicPubkey]);
      }

      for (const privatePubkey of this.data.list.unsafedPrivatePubkeys ??
        this.data.list.privatePubkeys) {
        privateTags.push(['p', privatePubkey]);
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
            this._dialogRef.close(true);
          }
        }
      );
      this._mainService.publishEventToMyRelays(channelId, event);
    } catch (error) {
      // TODO
    }
  }

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

    if (this.pubkeyVisibility === 'public') {
      this.data.list.addPublicPubkey(pubkey);
    } else {
      this.data.list.addPrivatePubkey(pubkey);
    }
    this.toBeAddedString = undefined;
  }
}
