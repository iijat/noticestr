import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NostrDataCollection } from 'src/app/models/nostrDataCollection';
import { NoticeStrMessage } from 'src/app/models/noticeStr';
import { MainService } from 'src/app/services/main.service';
import { NostrDataService } from 'src/app/services/nostr-data.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit {
  loading = false;

  constructor(
    private _mainService: MainService,
    //private _relayService: RelayService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    public nostrDataService: NostrDataService
  ) {}

  ngOnInit(): void {
    if (!this._mainService.nostrManager) {
      return;
    }
    this.nostrDataService.initialize(
      this._mainService.myRelays,
      this._mainService.nostrManager
    );
  }

  newMessage() {
    this._router.navigate(['new'], { relativeTo: this._activatedRoute });
  }
}
