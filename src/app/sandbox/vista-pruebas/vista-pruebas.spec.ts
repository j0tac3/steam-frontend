import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaPruebas } from './vista-pruebas';

describe('VistaPruebas', () => {
  let component: VistaPruebas;
  let fixture: ComponentFixture<VistaPruebas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaPruebas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VistaPruebas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
