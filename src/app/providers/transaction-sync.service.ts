import { Injectable } from '@angular/core';
import { TransactionsService } from './transactions.service';
import { TransactionsStorageService } from './transactions-storage.service';
import { Transaction } from '../models/transaction';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { StorageService } from '../shared/services/storage.service';
import { BlockSync } from '../models/block-sync';
import { PendingTransactionsStorageService } from './pending-transactions-storage.service';
import { clientConstants } from './akroma-client.constants';

@Injectable()
export class TransactionSyncService extends StorageService<BlockSync> {
  syncing: BehaviorSubject<boolean>;
  private addressesToSync: string[];

  constructor(
    private transactionsService: TransactionsService,
    private transactionStorageService: TransactionsStorageService,
    private pendingTransactionStorageService: PendingTransactionsStorageService) {
      super('txBlockSync', 'id');
      this.transactionsService.setProvider(new this.transactionsService.providers.HttpProvider(clientConstants.connection.default));
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
    console.log('Block Sync starts @', startBlock);
    const endBlockNumber = await this.transactionsService.eth.getBlockNumber();
    let lastBlockNumberSynced = startBlock;
    for (let i = startBlock; i < endBlockNumber; i++) {
      lastBlockNumberSynced = i;
      if (i % 1000 === 0) {
        console.log('At Block', i);
        const pendingTx = this.pendingTransactionStorageService.currentPendingTransactions;
        const transactions = await this.transactionsService.getTransactionsByAccounts(this.addressesToSync, i - 10, i + 1000);
        if (transactions.length > 0) {
          this.transactionStorageService.putMany(transactions);
        }
        if (pendingTx.length > 0) {
          this.cleanupPendingTransactionsAfterConfirmation(transactions);
        }
      }
      if (i % 1000 === 0) {
        const syncSavedResult = this.put({ currentBlock: lastBlockNumberSynced, id: 'currentBlock' });
        if (!syncSavedResult.hasOwnProperty('error')) {
          console.log('Sync saved @', lastBlockNumberSynced);
        }
      }
    }
  }

  stopSync(): void {
    this.syncing.next(false);
  }

  async getMostRecentBlockFromTransactions(): Promise<number> {
    const getResult = await this.get('currentBlock');
    if (!getResult.hasOwnProperty('error')) {
      return (getResult as BlockSync).currentBlock;
    }
    const allTransactions = await this.transactionStorageService.getAll() as Transaction[];
    if (allTransactions.length > 0) {
      const syncedBlockNumbers = allTransactions.map(x => !!x.blockNumber ? x.blockNumber : 0);
      return Math.max(...syncedBlockNumbers);
    }
    return 0;
  }

  async cleanupPendingTransactionsAfterConfirmation(transactions: Transaction[]): Promise<void> {
    transactions.forEach(tx => this.pendingTransactionStorageService.delete(tx));
  }
}
