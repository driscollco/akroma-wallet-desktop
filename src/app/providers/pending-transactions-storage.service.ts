import { Injectable } from '@angular/core';

import { StorageService } from '../shared/services/storage.service';
import { Transaction } from '../models/transaction';

@Injectable()
export class PendingTransactionsStorageService extends StorageService<Transaction> {

  constructor() {
    super('pendingTransactions', 'hash');
  }

}
