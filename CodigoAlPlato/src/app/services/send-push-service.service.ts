import { inject, Injectable } from '@angular/core';

export const FCM_TOKEN = 'push_notification_token';

@Injectable({
  providedIn: 'root',
})
export class SendPushService {
  private readonly API_BASE_URL = 'https://puuushs.onrender.com/send-push';

  constructor() {}

  public async sendToRole(title: string, body: string, role: any) {
    console.log('sending push to users with role: ' + role);

    const res = await fetch(this.API_BASE_URL + '/notify-role', {
      method: 'POST', // Especifica que esta es una solicitud POST
      headers: {
        'Content-Type': 'application/json', // Indica que el cuerpo de la solicitud es JSON
      },
      body: JSON.stringify({
        title,
        body,
        role,
      }),
    });
    const resData = await res.json();

    console.log(resData);
  }

  public async sendToToken(title: string, body: string, token: string) {
    const res = await fetch(this.API_BASE_URL, {
      method: 'POST', // Especifica que esta es una solicitud POST
      headers: {
        'Content-Type': 'application/json', // Indica que el cuerpo de la solicitud es JSON
      },
      body: JSON.stringify({
        title,
        body,
        token,
      }),
    });
    const resData = await res.json();

    console.log(resData);
  }
}
