import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalV2 } from './modal-v2';

describe('ModalV2', () => {
  let component: ModalV2;
  let fixture: ComponentFixture<ModalV2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalV2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalV2);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
