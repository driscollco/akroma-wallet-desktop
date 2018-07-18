import { TestBed, inject } from '@angular/core/testing';

import { PendingTransactionsStorageService } from './pending-transactions-storage.service';

describe('PendingTransactionsStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PendingTransactionsStorageService],
    });
  });

  it('should be created', inject([PendingTransactionsStorageService], (service: PendingTransactionsStorageService) => {
    expect(service).toBeTruthy();
  }));
});
