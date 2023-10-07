import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  NostrDataCollection,
  NostrDataCollectionConfig,
} from 'src/app/models/nostrDataCollection';
import { NoticeStrMessage } from 'src/app/models/noticeStr';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  loading = false;
  messages: NostrDataCollection<NoticeStrMessage> | undefined;

  #crawledMeSubscription: Subscription | undefined;

  constructor(
    private _mainService: MainService,
    //private _relayService: RelayService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const a = 3;
    // if (this._relayService.crawledMe) {
    //   this._loadMessages();
    //   return;
    // }
    // this.#crawledMeSubscription = this._relayService.crawledMeEvent.subscribe(
    //   () => {
    //     this.#crawledMeSubscription?.unsubscribe();
    //     this._loadMessages();
    //   }
    // );
  }

  ngOnDestroy(): void {
    this.#crawledMeSubscription?.unsubscribe();
  }

  newMessage() {
    this._router.navigate(['new'], { relativeTo: this._activatedRoute });
  }

  // private async _loadMessages() {
  //   if (!this._mainService.myPubkey) {
  //     return;
  //   }

  //   if (!this._mainService.nostrManager) {
  //     return;
  //   }

  //   const conf: NostrDataCollectionConfig = {
  //     name: 'noticestr_messages',
  //     fromRelays: this._relayService.publishRelays,
  //     manager: this._mainService.nostrManager,
  //   };

  //   this.messages = new NostrDataCollection(conf);
  // }
}
