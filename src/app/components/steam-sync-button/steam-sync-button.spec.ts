import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteamSyncButton } from './steam-sync-button';

describe('SteamSyncButton', () => {
  let component: SteamSyncButton;
  let fixture: ComponentFixture<SteamSyncButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SteamSyncButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SteamSyncButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
