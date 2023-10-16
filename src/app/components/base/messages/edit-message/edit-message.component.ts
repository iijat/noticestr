import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NostrDataObject } from 'src/app/models/nostrDataObject';
import { NoticeStrMessage } from 'src/app/models/noticeStr';
import { NostrDataService } from 'src/app/services/nostr-data.service';
import { SelectionService } from 'src/app/services/selection.service';

@Component({
  selector: 'app-edit-message',
  templateUrl: './edit-message.component.html',
  styleUrls: ['./edit-message.component.scss'],
})
export class EditMessageComponent implements OnInit, OnDestroy {
  message: NostrDataObject<NoticeStrMessage> | undefined;
  @ViewChild('messageTextarea')
  set messageTextarea(value: ElementRef | undefined) {
    if (!value) {
      return;
    }

    const element = value.nativeElement as HTMLElement;
    element.style.height = 'auto';
    element.style.height = '100%';
  }

  messageId: string | undefined;

  constructor(
    private _activatedRoute: ActivatedRoute,
    public nostrDataService: NostrDataService,
    private _selectionService: SelectionService
  ) {}

  ngOnInit(): void {
    this._activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id') ?? undefined;
      if (!id) {
        return;
      }

      this.messageId = id;

      window.setTimeout(() => {
        this._selectionService.selectedMessageId = id;
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this._selectionService.selectedMessageId = undefined;
  }

  show() {
    if (!this.messageId) {
      return;
    }
    console.log(this.nostrDataService.messages?.items);

    const result = this.nostrDataService.messages?.items.get(this.messageId);
    this.message = result;

    console.log(result);
  }

  autoresize(event: Event) {
    // const element = event.target as HTMLElement;
    // element.style.height = 'auto';
    // element.style.height = element.scrollHeight + 'px';
  }

  // onMessageChange(event: any) {
  //   console.log(event);

  //   const element = this.messageTextarea;
  //   if (!element) {
  //     return;
  //   }
  //   element.style.height = 'auto';
  //   element.style.height = element.scrollHeight + 'px';
  // }
}
