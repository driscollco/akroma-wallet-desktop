import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';
import { Wallet } from '../models/wallet';
import { StorageService } from '../shared/services/storage.service';

@Injectable()
export class WalletPersistenceService extends StorageService<Wallet> {
  constructor() {
    super('wallets', 'address');
  }
}
