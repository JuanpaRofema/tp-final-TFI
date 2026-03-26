import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ModalController, Platform } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';

@Component({
  selector: 'app-sala-de-juegos',
  templateUrl: './sala-de-juegos.component.html',
  styleUrls: ['./sala-de-juegos.component.scss'],
  standalone:true,
  imports:[FontAwesomeModule, RouterLink]
})
export class SalaDeJuegosComponent  implements OnInit {

  faRightFromBracket = faRightFromBracket;
    faComent = faComment;

  constructor(protected auth: AuthService,
      protected router: Router,
      private modalController: ModalController,
      protected platform: Platform,
      protected db: DatabaseService,
      protected pushService: pushService) { }

  ngOnInit() {}


  cerrarSesion() {
  if (this.auth.usuarioIngresado.tipoPedido === 'delivery') {
    if(this.auth.usuarioIngresado.estadoPedido === 'consumiendo'){
      this.router.navigateByUrl('/cliente-recibe-pedido');
    }else{
      this.router.navigateByUrl('/cliente-espera-delivery');
    }
  } else {
    if(this.auth.usuarioIngresado.estadoPedido === 'consumiendo'){
      this.router.navigateByUrl('/cliente-recibe-pedido');
    }else{
      this.router.navigateByUrl('/cliente-espera-pedido');
    }
  }
}

}
