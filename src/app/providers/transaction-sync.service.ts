import { Injectable } from '@angular/core';
import { TransactionsService } from './transactions.service';
import { TransactionsStorageService } from './transactions-storage.service';
import { Transaction } from '../models/transaction';

@Injectable()
export class TransactionSyncService {
  private addresses: string[];

  constructor(
    private transactionsService: TransactionsService,
    private transactionStorageService: TransactionsStorageService) {
    this.addresses = [];
  }

  setAddresses(addresses: string[]): TransactionSyncService {
    this.addresses = addresses;
    return this;
  }

  startSync(): void {
    // todo
  }

  stopSync(): void {
    // todo
  }

  async getMostRecentBlockFromTransactions(): Promise<number> {
    const allTransactions = await this.transactionStorageService.getAll() as Transaction[];
    if (allTransactions.length > 0) {
      const syncedBlockNumbers = allTransactions.map(x => x.blockNumber);
      return Math.max(...syncedBlockNumbers);
    }
    return 0;
  }
}
