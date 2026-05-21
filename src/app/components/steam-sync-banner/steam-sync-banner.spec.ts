import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteamSyncBanner } from './steam-sync-banner';

describe('SteamSyncBanner', () => {
  let component: SteamSyncBanner;
  let fixture: ComponentFixture<SteamSyncBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SteamSyncBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SteamSyncBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
