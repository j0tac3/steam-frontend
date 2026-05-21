import { TestBed } from '@angular/core/testing';

import { SteamSync } from './steam-sync';

describe('SteamSync', () => {
  let service: SteamSync;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SteamSync);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
