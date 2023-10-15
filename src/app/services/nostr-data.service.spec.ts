import { TestBed } from '@angular/core/testing';

import { NostrDataService } from './nostr-data.service';

describe('NostrDataService', () => {
  let service: NostrDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NostrDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
