import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Introduccion } from './introduccion';

describe('Introduccion', () => {
  let component: Introduccion;
  let fixture: ComponentFixture<Introduccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Introduccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Introduccion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
