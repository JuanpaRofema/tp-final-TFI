import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ModalController, Platform } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { CambioIdioma } from 'src/app/services/cambio-idioma';
import { DatabaseService } from 'src/app/services/database.service';
import { pushService } from 'src/app/services/serviciosPush/push-notifications.service';
import { DICCIONARIO } from 'src/assets/diccionario';

@Component({
  selector: 'app-sala-de-juegos',
  templateUrl: './sala-de-juegos.component.html',
  styleUrls: ['./sala-de-juegos.component.scss'],
  standalone:true,
  imports:[FontAwesomeModule, RouterLink]
})
export class SalaDeJuegosComponent  implements OnInit {
    diccionario: any = DICCIONARIO
    idioma: any = signal("es")
    cambioIdioma = inject(CambioIdioma)
  faRightFromBracket = faRightFromBracket;
    faComent = faComment;

  constructor(protected auth: AuthService,
      protected router: Router,
      private modalController: ModalController,
      protected platform: Platform,
      protected db: DatabaseService,
      protected pushService: pushService) { }

   ngOnInit() {
    this.cambioIdioma.idiomaActual$.subscribe(data => this.idioma.set(data[0]))
  }


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
