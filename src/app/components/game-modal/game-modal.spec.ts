import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameModal } from './game-modal';

describe('GameModal', () => {
  let component: GameModal;
  let fixture: ComponentFixture<GameModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
