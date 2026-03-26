import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';
import { pushService } from './services/serviciosPush/push-notifications.service';
import { DatabaseService } from './services/database.service';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Router } from '@angular/router';
import { SplashscreenComponent } from './components/components.component';
import { CommonModule } from '@angular/common'; 
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { InfoPedidoComponent } from './components/info-pedido/info-pedido.component';
import { PedidoService } from './services/pedido.service';

GoogleAuth.initialize();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, SplashscreenComponent, CommonModule, InfoPedidoComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  
  showSplash = true;
  mostrarBotonInfo: boolean = false; 
  
  private subs: Subscription = new Subscription();

  constructor(
    private platform: Platform,
    protected db: DatabaseService,
    protected auth: AuthService,
    protected pushService: pushService,
    protected router: Router,
    public pedidoService: PedidoService, 
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    
    this.subs.add(
      this.pedidoService.escucharPedidoCliente() 
    );

    this.subs.add(
      this.pedidoService.mostrarInfo$.subscribe((mostrar) => {
        this.mostrarBotonInfo = mostrar;
      })
    );

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const extra = notification.notification.extra;
      
      // 1. LOG DE DEPURACIÓN: Mira la consola al tocar la notificación
      console.log('🔔 Notificación tocada. Datos extra:', extra);

      if (!extra) return;

      this.ngZone.run(() => {
        // Acciones Específicas
        if (extra.action === 'abrirPdf') {
          window.open(extra.targetPage, '_system');
        } 
        else if (extra.action === 'abrirChat') {
          this.router.navigate(['/chat']);
        } 
        else if (extra.action === 'abrirChatDelivery') {
          this.router.navigate(['/chat-delivery']);
        } 
        else if (extra.action === 'abrirListado') {
          this.router.navigate(['/listado-productos']);
        }
        else if (extra.action === 'abrirDelivery') {
          console.log('Redirigiendo a Delivery por acción...');
          this.router.navigateByUrl('/delivery'); // Usamos navigateByUrl que a veces fuerza mejor la ruta
        }
        
        // 2. FALLBACK (PLAN B):
        // Si no entró en ningún if anterior, pero tiene una ruta (targetPage), ir ahí.
        // Esto arregla el problema si olvidaste poner el "action" al enviar la push.
        else if (extra.targetPage && typeof extra.targetPage === 'string' && extra.targetPage.startsWith('/')) {
             console.log('Acción no encontrada, usando targetPage:', extra.targetPage);
             this.router.navigateByUrl(extra.targetPage);
        }
      });
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  onSplashFinished() {
    this.showSplash = false;
  }

  ngAfterViewInit() {
  const container = document.getElementById('snapContainer');

  if (!container) return;

  let bloqueado = false;

  container.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault(); // ⛔ bloquea scroll libre del navegador

    if (bloqueado) return;
    bloqueado = true;

    const direccion = Math.sign(e.deltaY); // 1 baja, -1 sube
    const altura = container.clientHeight;

    container.scrollBy({
      top: direccion * altura,
      behavior: 'smooth'
    });

    setTimeout(() => {
      bloqueado = false;
    }, 650); // tiempo del snap
  }, { passive: false });
}


}