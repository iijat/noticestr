import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { EventTemplate, Kind } from 'nostr-tools';
import { NostrHelperV3 } from 'src/app/common/nostrHelperV3';
import { PeopleListWrapper } from 'src/app/common/peopleListWrapper';
import { MatDialog } from '@angular/material/dialog';
import { CreateNewPeopleListComponent } from 'src/app/component-dialogs/create-new-people-list/create-new-people-list.component';
import { ConfirmService } from 'src/app/services/confirm.service';
import { v4 } from 'uuid';
import { SakService } from 'src/app/services/sak.service';
import {
  EditPeopleListDialogComponent,
  EditPeopleListDialogData,
} from 'src/app/component-dialogs/edit-people-list-dialog/edit-people-list-dialog.component';

@Component({
  selector: 'app-nostr-people-lists',
  templateUrl: './nostr-people-lists.component.html',
  styleUrls: ['./nostr-people-lists.component.scss'],
})
export class NostrPeopleListsComponent implements OnInit {
  peopleLists: PeopleListWrapper[] | undefined;

  expanded = new Map<number, boolean>();
  selected = new Map<string, boolean>();
  activity = false;

  constructor(
    public mainService: MainService,
    private _clipboard: Clipboard,
    private _matDialog: MatDialog,
    private _confirmService: ConfirmService,
    public sakService: SakService
  ) {}

  ngOnInit(): void {
    this.#loadData();
  }

  copyNpubToClipboard(pubkey: string) {
    const npub = NostrHelperV3.getNostrPubkeyObject(pubkey).npub;
    this._clipboard.copy(npub);
  }

  copyHexToClipboard(pubkey: string) {
    this._clipboard.copy(pubkey);
  }

  copyNip05ToClipboard(pubkey: string) {
    const meta = this.mainService.metadata.get(pubkey);
    if (!meta?.confirmedNip05) {
      return;
    }

    this._clipboard.copy(meta.confirmedNip05);
  }

  async publish(list: PeopleListWrapper) {
    if (!list.hasUnsafedChanges) {
      return;
    }

    this.activity = true;
    try {
      const tags: string[][] = [];

      // Handle the name of the list.
      tags.push(['d', list.listName ?? 'Unknown People List']);

      // Handle the public pubkeys.
      list.unsafedPublicPubkeys?.forEach((x) => {
        tags.push(['p', x]);
      });

      // Handle the private pubkeys.
      let content = '';
      if (list.hasUnsafedPrivatePubkeys) {
        const privateJson: string[][] = [];
        list.unsafedPrivatePubkeys?.forEach((x) => {
          privateJson.push(['p', x]);
        });

        const encryptedContent =
          await this.mainService.nostrManager?.nostrConnector.encrypt(
            JSON.stringify(privateJson)
          );

        if (!encryptedContent) {
          throw new Error('Error signing event.');
        }

        content = encryptedContent;
      }

      const eventTemplate: EventTemplate = {
        kind: 30000 as any,
        created_at: Math.floor(Date.now() / 1000),
        tags: tags,
        content,
      };

      // Sign event.
      const event =
        await this.mainService.nostrManager?.nostrConnector.signEvent(
          eventTemplate
        );

      if (!event) {
        throw new Error('Error signing event.');
      }

      // Publish event on relevant relays.
      const channelId = v4();
      this.mainService.nostrManager?.nostrPubSub.on(
        channelId,
        (eos, relayEvents) => {
          relayEvents.forEach((x) => this.mainService.setPeopleList(x));
        }
      );
      this.mainService.publishEventToMyRelays(channelId, event);
    } catch (error) {
      // TODO
      console.log(error);
    } finally {
      this.activity = false;
    }
  }

  async delete(list: PeopleListWrapper) {
    this._confirmService.show(
      `Are you sure that you want to delete the list '<b>${list.listName}</b>'?`,
      async () => {
        const eventTemplate: EventTemplate = {
          kind: Kind.EventDeletion,
          content: 'User requested deletion of the list.',
          tags: [
            ['a', `30000:${list.relayEvent.event.pubkey}:${list.listName}`],
          ],
          created_at: Math.floor(Date.now() / 1000),
        };
        const event =
          await this.mainService.nostrManager?.nostrConnector.signEvent(
            eventTemplate
          );
        if (!event) {
          // TODO: Error visualization.
          return;
        }
        const channelId = v4();
        this.mainService.nostrManager?.nostrPubSub.on(
          channelId,
          (eos, relayEvents) => {
            console.log('delete list on');
            console.log(relayEvents);
            relayEvents.forEach((x) => this.mainService.setPeopleList(x));

            if (eos) {
              this.mainService.nostrManager?.nostrRelayer.cache.persistDeletionEvents();
            }
          }
        );
        this.mainService.publishEventToMyRelays(channelId, event);
      }
    );
  }

  onClickNewPeopleList() {
    const dialog = this._matDialog.open(CreateNewPeopleListComponent, {
      autoFocus: false,
      width: '880px',
      maxWidth: '880px',
    });
  }

  editPeopleList(list: PeopleListWrapper) {
    const data: EditPeopleListDialogData = {
      list,
    };

    const dialog = this._matDialog.open(EditPeopleListDialogComponent, {
      data,
      minWidth: 900,
    });

    dialog.afterClosed().subscribe((hasPublished: boolean) => {
      if (!hasPublished) {
        list.resetChanges();
      }
    });
  }

  async #loadData() {
    if (!this.mainService.myPubkey) {
      return;
    }

    this.peopleLists = await this.mainService.fetchPeopleLists(
      this.mainService.myPubkey,
      () => {
        this.mainService.nostrManager?.nostrRelayer.cache.persistDeletionEvents();
      }
    );
  }
}
