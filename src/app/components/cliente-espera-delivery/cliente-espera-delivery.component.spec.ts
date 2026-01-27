import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ClienteEsperaDeliveryComponent } from './cliente-espera-delivery.component';

describe('ClienteEsperaDeliveryComponent', () => {
  let component: ClienteEsperaDeliveryComponent;
  let fixture: ComponentFixture<ClienteEsperaDeliveryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClienteEsperaDeliveryComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteEsperaDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
