import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';

import { QRCodeModule } from 'angularx-qrcode';
import { FormsModule } from '@angular/forms';

import { MtxPopoverModule } from '@ng-matero/extensions/popover';
import { MtxSplitModule } from '@ng-matero/extensions/split';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LandingComponent } from './components/landing/landing.component';
import { HomeComponent } from './components/home/home.component';
import { BaseComponent } from './components/base/base.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClipboardComponent } from './component-helpers/clipboard/clipboard.component';
import { SidebarComponent } from './component-helpers/sidebar/sidebar.component';
import { OwnRelayDialogComponent } from './component-dialogs/own-relay-dialog/own-relay-dialog.component';
import { NostrPeopleListsComponent } from './components/base/nostr-people-lists/nostr-people-lists.component';
import { CardComponent } from './component-helpers/card/card.component';
import { MessagesComponent } from './components/base/messages/messages.component';
import { SpinnerComponent } from './component-helpers/spinner/spinner.component';
import { CreateNewPeopleListComponent } from './component-dialogs/create-new-people-list/create-new-people-list.component';
import { NewMessageComponent } from './components/base/messages/new-message/new-message.component';
import { EditMessageComponent } from './components/base/messages/edit-message/edit-message.component';
import { UserComponent } from './component-helpers/user/user.component';
import { LinkComponent } from './component-helpers/link/link.component';
import { ToolbarComponent } from './component-helpers/toolbar/toolbar.component';
import { ConfirmDialogComponent } from './component-dialogs/confirm-dialog/confirm-dialog.component';
import { InfoComponent } from './component-helpers/info/info.component';
import { EditPeopleListDialogComponent } from './component-dialogs/edit-people-list-dialog/edit-people-list-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    HomeComponent,
    BaseComponent,
    ClipboardComponent,
    SidebarComponent,
    OwnRelayDialogComponent,
    NostrPeopleListsComponent,
    CardComponent,
    MessagesComponent,
    SpinnerComponent,
    CreateNewPeopleListComponent,
    NewMessageComponent,
    EditMessageComponent,
    UserComponent,
    LinkComponent,
    ToolbarComponent,
    ConfirmDialogComponent,
    InfoComponent,
    EditPeopleListDialogComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    BrowserAnimationsModule,
    FormsModule,

    QRCodeModule,

    MtxPopoverModule,
    MtxSplitModule,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatRippleModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
