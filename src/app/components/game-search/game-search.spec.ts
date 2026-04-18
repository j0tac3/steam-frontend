import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameSearch } from './game-search';

describe('GameSearch', () => {
  let component: GameSearch;
  let fixture: ComponentFixture<GameSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
