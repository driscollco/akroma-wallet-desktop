import { Injectable } from '@angular/core';

import { StorageService, StorageOperationError } from '../shared/services/storage.service';
import { Transaction } from '../models/transaction';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class PendingTransactionsStorageService extends StorageService<Transaction> {
  currentPendingTransactions: Transaction[];
  currentlyPendingTransactionsSubject: BehaviorSubject<Transaction[]>;

  constructor() {
    super('pendingTransactions', 'hash');
    this.currentPendingTransactions = [];
    this.initializeCurrentlyPendingTransactions();
  }

  private async initializeCurrentlyPendingTransactions() {
    const allPending = await this.getAll();
    if (allPending.hasOwnProperty('error')) {
      return;
    }
    this.currentlyPendingTransactionsSubject = new BehaviorSubject<Transaction[]>(allPending as Transaction[]);
  }

  async put(item: Transaction): Promise<Transaction | StorageOperationError> {
    const writtenPending = await super.put(item);
    if (!writtenPending.hasOwnProperty('error')) {
      this.currentPendingTransactions = [...this.currentPendingTransactions, item];
      this.currentlyPendingTransactionsSubject.next(this.currentPendingTransactions);
    }
    return writtenPending;
  }

  async delete(item: Transaction | string): Promise<PouchDB.Core.Response | StorageOperationError> {
    const deletedResult = await super.delete(item); 
    if (!deletedResult.hasOwnProperty('error')) {
      this.currentPendingTransactions = this.currentPendingTransactions.filter(x => x.hash !== (<Transaction>item).hash);
      this.currentlyPendingTransactionsSubject.next(this.currentPendingTransactions);
    }
    return deletedResult;
  }

}
