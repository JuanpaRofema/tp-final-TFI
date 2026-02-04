import { Component, OnInit } from '@angular/core';
import { PersonajeService } from 'src/app/services/personaje.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ModalController, Platform } from '@ionic/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faComment, faRightFromBracket, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';


@Component({
  selector: 'app-personaje',
  templateUrl: './personaje.component.html',
  styleUrls: ['./personaje.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, FontAwesomeModule]
})
export class PersonajeComponent implements OnInit {

  faRightFromBracket = faRightFromBracket;
      faComent = faComment;
  iconSignOutAlt = faSignOutAlt;

  personajes: any[] = [];

  constructor(private personajeService: PersonajeService, protected auth: AuthService,
            protected router: Router,
            private modalController: ModalController,
            protected platform: Platform,
            protected db: DatabaseService,) { }

  ngOnInit() {

    this.personajes = this.personajeService.getPersonajes();
  }

  seleccionarPersonaje(personaje: any) {

    this.personajeService.setPersonaje(personaje.nombre, personaje.img);

    this.router.navigateByUrl('/juegokinetico');
  }



  logOut(){
    this.router.navigate(['/kinetico']);
  }

}
