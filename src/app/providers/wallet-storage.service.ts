import { Injectable } from '@angular/core';

import { Wallet } from '../models/wallet';
import { StorageService } from '../shared/services/storage.service';

@Injectable()
export class WalletStorageService extends StorageService<Wallet> {
  constructor() {
    super('wallets', 'address');
  }
}
