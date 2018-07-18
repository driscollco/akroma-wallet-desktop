import { TestBed, inject } from '@angular/core/testing';

import { TransactionsStorageService } from './transactions-storage.service';

describe('TransactionsStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransactionsStorageService],
    });
  });

  it('should be created', inject([TransactionsStorageService], (service: TransactionsStorageService) => {
    expect(service).toBeTruthy();
  }));
});
