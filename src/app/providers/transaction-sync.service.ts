import { Injectable } from '@angular/core';
import { TransactionsService } from './transactions.service';
import { TransactionsStorageService } from './transactions-storage.service';
import { Transaction } from '../models/transaction';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class TransactionSyncService {
  syncing: Subject<boolean>;
  private addresses: string[];

  constructor(
    private transactionsService: TransactionsService,
    private transactionStorageService: TransactionsStorageService) {
    this.addresses = [];
    this.syncing = new Subject();
    this.syncing.next(false);
  }

  setAddresses(addresses: string[]): TransactionSyncService {
    this.addresses = addresses;
    return this;
  }

  async startSync(): Promise<void> {
    this.syncing.next(true);
    const startBlock = await this.getMostRecentBlockFromTransactions();
    const endBlockNumber = await this.transactionsService.eth.getBlockNumber();
    for (let i = startBlock; i < endBlockNumber; i++) {
    // todo
    }
  }

  stopSync(): void {
    this.syncing.next(false);
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
