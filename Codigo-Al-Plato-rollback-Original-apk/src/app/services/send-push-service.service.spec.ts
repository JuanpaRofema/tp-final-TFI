import { TestBed } from '@angular/core/testing';

import { SendPushServiceService } from './send-push-service.service';

describe('SendPushServiceService', () => {
  let service: SendPushServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SendPushServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
