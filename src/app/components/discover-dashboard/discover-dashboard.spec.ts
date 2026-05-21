import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoverDashboard } from './discover-dashboard';

describe('DiscoverDashboard', () => {
  let component: DiscoverDashboard;
  let fixture: ComponentFixture<DiscoverDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscoverDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
