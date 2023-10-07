import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
})
export class LinkComponent {
  @Input() href: string | undefined;
  @Input() name: string | undefined;
  @Input() tooltip: string | undefined;

  onClick() {
    window.open(this.href, '_blank');
  }
}
