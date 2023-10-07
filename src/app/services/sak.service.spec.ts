import { TestBed } from '@angular/core/testing';

import { SakService } from './sak.service';

describe('SakService', () => {
  let service: SakService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SakService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
