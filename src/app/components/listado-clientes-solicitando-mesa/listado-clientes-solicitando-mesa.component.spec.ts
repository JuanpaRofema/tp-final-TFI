import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListadoClientesSolicitandoMesaComponent } from './listado-clientes-solicitando-mesa.component';

describe('ListadoClientesSolicitandoMesaComponent', () => {
  let component: ListadoClientesSolicitandoMesaComponent;
  let fixture: ComponentFixture<ListadoClientesSolicitandoMesaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListadoClientesSolicitandoMesaComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoClientesSolicitandoMesaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
