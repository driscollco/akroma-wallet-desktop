import { TestBed, inject } from '@angular/core/testing';

import { WalletStorageService } from './wallet-storage.service';

describe('WalletStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WalletStorageService],
    });
  });

  it('should be created', inject([WalletStorageService], (service: WalletStorageService) => {
    expect(service).toBeTruthy();
  }));
});
