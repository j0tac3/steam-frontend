import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchGameCard } from './search-game-card';

describe('SearchGameCard', () => {
  let component: SearchGameCard;
  let fixture: ComponentFixture<SearchGameCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchGameCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchGameCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
