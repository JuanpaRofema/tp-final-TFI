import { inject, Injectable } from '@angular/core';

// import { Injectable } from '@angular/core';
import {
  LocalNotifications,
  ScheduleOptions,
} from '@capacitor/local-notifications';

export const FCM_TOKEN = 'push_notification_token';

@Injectable({
  providedIn: 'root',
})
export class pushService {
  id: number = 1;

  constructor() {}

  async send(
    title: string,
    body: string,
    tPage: string,
    redirigir: boolean = true,
    mesa: string = '',
    action:string=''
  ) {
    let options: ScheduleOptions;
   if (redirigir && tPage !== '') {
      options = {
        notifications: [
          {
            id: this.id,
            title: title,
            body: body,
            smallIcon: 'res/drawable/iconforeground',
            largeIcon: 'res/drawable/iconforeground',
            extra: { targetPage: tPage,
              action: action  
             },
          },
        ],
    };
    } else {
      options = {
        notifications: [
          {
            id: this.id,
            title: title,
            body: body,
            smallIcon: 'res/drawable/iconforeground',
            largeIcon: 'res/drawable/iconforeground',
            extra: { 
              mesa: mesa,
              action: action 
            },
          },
        ],
      };
    }
    this.id++;
    try {
      await LocalNotifications.schedule(options);
    } catch (e) {
      console.log(e);
    }
  }
}
