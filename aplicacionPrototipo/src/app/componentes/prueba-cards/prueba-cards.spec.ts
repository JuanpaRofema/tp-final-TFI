import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PruebaCards } from './prueba-cards';

describe('PruebaCards', () => {
  let component: PruebaCards;
  let fixture: ComponentFixture<PruebaCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PruebaCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PruebaCards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
