import { TestBed } from '@angular/core/testing';

import { pushService } from './push-notifications.service';

describe('PushNotificationsService', () => {
  let service: pushService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(pushService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
