import { Injectable } from '@angular/core';
import { TransactionsService } from './transactions.service';
import { TransactionsStorageService } from './transactions-storage.service';
import { Transaction } from '../models/transaction';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { StorageService } from '../shared/services/storage.service';
import { BlockSync } from '../models/block-sync';
import { PendingTransactionsStorageService } from './pending-transactions-storage.service';

@Injectable()
export class TransactionSyncService extends StorageService<BlockSync> {
  syncing: BehaviorSubject<boolean>;
  private addressesToSync: string[];

  constructor(
    private transactionsService: TransactionsService,
    private transactionStorageService: TransactionsStorageService,
    private pendingTransactionStorageService: PendingTransactionsStorageService) {
      super("txBlockSync", "currentBlock");
      this.addressesToSync = [];
      this.syncing = new BehaviorSubject(false);
  }

  setAddressesToSync(addresses: string[]): TransactionSyncService {
    this.addressesToSync = addresses;
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
        const pendingTx = this.pendingTransactionStorageService.currentPendingTransactions;
        const transactions = await this.transactionsService.getTransactionsByAccounts(this.addressesToSync, i - 10, i + 1000);
        if (transactions.length > 0) {
          await this.transactionStorageService.putMany(transactions);
        }
        if (pendingTx.length > 0) {
          this.cleanupPendingTransactionsAfterConfirmation(transactions);
        }
      }
      if (i % 10 === 0) {
        // await this.put({ currentBlock: lastBlockNumberSynced });
        this.put({ currentBlock: lastBlockNumberSynced });
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

  async cleanupPendingTransactionsAfterConfirmation(transactions: Transaction[]): Promise<void> {
    transactions.forEach(tx => this.pendingTransactionStorageService.delete(tx));
  }
}
