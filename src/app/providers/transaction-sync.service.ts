import { Injectable } from '@angular/core';
import { TransactionsService } from './transactions.service';
import { TransactionsStorageService } from './transactions-storage.service';
import { Transaction } from '../models/transaction';
import { Subject } from 'rxjs/Subject';
import { StorageService } from '../shared/services/storage.service';
import { BlockSync } from '../models/block-sync';

@Injectable()
export class TransactionSyncService extends StorageService<BlockSync> {
  syncing: Subject<boolean>;
  private addresses: string[];

  constructor(
    private transactionsService: TransactionsService,
    private transactionStorageService: TransactionsStorageService) {
      super("txBlockSync", "currentBlock");
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
    let lastBlockNumberSynced = startBlock;
    for (let i = startBlock; i < endBlockNumber; i++) {
      lastBlockNumberSynced = i;
      if (i % 1000 === 0) {
        const transactions = await this.transactionsService.getTransactionsByAccounts(this.addresses, i - 10, i + 1000);
        if (transactions.length > 0) {
          await this.transactionStorageService.putMany(transactions);
        }
      }
      if (i % 10 === 0) {
        await this.put({ currentBlock: lastBlockNumberSynced });
      }
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
