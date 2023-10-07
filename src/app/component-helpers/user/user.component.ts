import { Component, OnInit, Input } from '@angular/core';
import { RelayListWrapper } from 'src/app/common/relayListWrapper';
import { MetadataWrapper } from 'src/app/common/typeDefs';
import { MainService } from 'src/app/services/main.service';
import { v4 } from 'uuid';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  @Input() pubkey: string | undefined;

  get relayListWrapper() {
    return this.#relayListWrapper;
  }

  #relayListWrapper: RelayListWrapper | undefined;

  constructor(public mainService: MainService) {}

  ngOnInit(): void {
    this.#loadData();
  }

  async #loadData() {
    if (!this.pubkey) {
      return;
    }

    const metadata = this.mainService.metadata.get(this.pubkey);
    const relayList = this.mainService.relayList.get(this.pubkey);

    if (metadata || relayList) {
      return;
    }

    this.mainService.fetchInfoAbout(this.pubkey);
  }
}
