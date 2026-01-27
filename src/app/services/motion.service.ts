import { Injectable, OnDestroy } from '@angular/core';
import { Motion } from '@capacitor/motion';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MotionService implements OnDestroy {

  private movimiento$ = new Subject<{ x: number; y: number; z: number }>();

  constructor() {
    this.iniciar();
  }

  private async iniciar() {
    try {

      // Escucha los datos del acelerómetro
      await Motion.addListener('accel', event => {
        const { x, y, z } = event.accelerationIncludingGravity;
        this.movimiento$.next({ x, y, z });
      });

    } catch (error) {
      console.error('Error al iniciar Motion:', error);
    }
  }


  getMovimiento() {
    return this.movimiento$.asObservable();
  }


  ngOnDestroy() {
    Motion.removeAllListeners();
  }
}