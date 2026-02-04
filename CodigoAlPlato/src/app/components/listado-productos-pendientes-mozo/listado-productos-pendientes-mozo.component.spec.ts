import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListadoProductosPendientesMozoComponent } from './listado-productos-pendientes-mozo.component';

describe('ListadoProductosPendientesMozoComponent', () => {
  let component: ListadoProductosPendientesMozoComponent;
  let fixture: ComponentFixture<ListadoProductosPendientesMozoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListadoProductosPendientesMozoComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoProductosPendientesMozoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
