import { TestBed } from '@angular/core/testing';

import { IgdbData } from './igdb-data';

describe('IgdbData', () => {
  let service: IgdbData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IgdbData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
