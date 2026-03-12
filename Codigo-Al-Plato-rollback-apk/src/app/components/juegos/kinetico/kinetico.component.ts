import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, Platform } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { PersonajeService } from 'src/app/services/personaje.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faRightFromBracket, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { IonicModule, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { DatabaseService } from 'src/app/services/database.service';


@Component({
  selector: 'app-kinetico',
  templateUrl: './kinetico.component.html',
  styleUrls: ['./kinetico.component.scss'],
  standalone:true,
  imports:[FontAwesomeModule, IonicModule, FormsModule, CommonModule, RouterLink]
})
export class KineticoComponent  {

  faRightFromBracket = faRightFromBracket;
    faComent = faComment;
  iconSignOutAlt = faSignOutAlt;
  iconScoreboard = faTrophy;

  constructor(private personajeService: PersonajeService, protected auth: AuthService,
          protected route: Router,
          private modalController: ModalController,
          protected platform: Platform,
          protected db: DatabaseService,) {}

  elegirFranquicia(franquicia: string) {
    // Guardamos la selección en el servicio
    this.personajeService.setFranquicia(franquicia);
    // Redirigimos a la selección de personajes
    this.route.navigate(['/personajes']);
  }

  logOut(){
    this.route.navigate(['/juego']);
  }

}
