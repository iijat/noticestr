import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import packageJson from '../../../../package.json';
import { MainService } from 'src/app/services/main.service';
import { SakService } from 'src/app/services/sak.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  version = packageJson.version;

  constructor(
    private _router: Router,
    public mainService: MainService,
    public sakService: SakService
  ) {}

  onClickBrand() {
    this._router.navigateByUrl('/home');
  }
}
