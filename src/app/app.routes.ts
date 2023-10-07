import { Route } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { HomeComponent } from './components/home/home.component';
import { BaseComponent } from './components/base/base.component';
import { NostrPeopleListsComponent } from './components/base/nostr-people-lists/nostr-people-lists.component';
import { MessagesComponent } from './components/base/messages/messages.component';
import { NewMessageComponent } from './components/base/messages/new-message/new-message.component';
import { EditMessageComponent } from './components/base/messages/edit-message/edit-message.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: LandingComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'base/:id',
        component: BaseComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'nostr-people-lists',
          },
          {
            path: 'nostr-people-lists',
            component: NostrPeopleListsComponent,
          },
          {
            path: 'messages',
            component: MessagesComponent,
            children: [
              {
                path: 'new',
                component: NewMessageComponent,
              },
              {
                path: ':id',
                component: EditMessageComponent,
              },
            ],
          },
        ],
      },
    ],
  },
];
