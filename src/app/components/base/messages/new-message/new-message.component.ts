import { Component } from '@angular/core';

class ToObject {
  pubkey?: string;
  nip05?: string;
}

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss'],
})
export class NewMessageComponent {
  readonly toObjects: ToObject[] = [];
}
