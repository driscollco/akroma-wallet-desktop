import { Injectable } from '@angular/core';

import { Transaction } from '../models/transaction';
import { StorageService } from '../shared/services/storage.service';

@Injectable()
export class TransactionsStorageService extends StorageService<Transaction> {

  constructor() {
    super('transactions', 'hash');
  }
}
