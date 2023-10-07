import { Component, Input, AfterViewInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-clipboard',
  templateUrl: './clipboard.component.html',
  styleUrls: ['./clipboard.component.scss'],
})
export class ClipboardComponent implements AfterViewInit {
  @Input() text: string | undefined;
  get visualText() {
    return this._visualText;
  }

  private _visualText: string | undefined;

  constructor(private _clipboard: Clipboard) {}

  ngAfterViewInit(): void {
    this._visualText = this.text;
  }

  onClickText() {
    this._clipboard.copy(this.text ?? 'na');

    this._visualText = 'copied to clipboard';

    window.setTimeout(() => {
      this._visualText = this.text;
    }, 800);
  }
}
