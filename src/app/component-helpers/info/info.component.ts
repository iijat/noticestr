import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent {
  @Input() position: 'top' | 'right' | 'bottom' | 'left' = 'right';

  get positionStart() {
    switch (this.position) {
      case 'top':
        return 'above';

      case 'right':
        return 'after';

      case 'bottom':
        return 'below';

      case 'left':
        return 'before';

      default:
        return 'after';
    }
  }
}
