import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardClean } from './card-clean';

describe('CardClean', () => {
  let component: CardClean;
  let fixture: ComponentFixture<CardClean>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardClean]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardClean);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
