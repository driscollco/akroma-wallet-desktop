import { TestBed, inject } from '@angular/core/testing';

import { TransactionSyncService } from './transaction-sync.service';

describe('TransactionSyncService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransactionSyncService]
    });
  });

  it('should be created', inject([TransactionSyncService], (service: TransactionSyncService) => {
    expect(service).toBeTruthy();
  }));
});
