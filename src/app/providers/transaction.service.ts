import { Injectable, OnDestroy } from '@angular/core';
import { AkromaTx } from '../models/akroma-tx';
import { SettingsService } from './settings.service';
import { TransactionRemoteService } from './transaction.remote.service';
import { TransactionSyncService } from './transaction.sync.service';

/**
 * TransactionService is an abstraction on TransactionSyncService and TransactionRemoveService
 * It returns transactions and transaction related information to the UI.
 * Users can decide to use TransactionSyncService or TransactionRemoveService via settings.
 */

@Injectable()
export class TransactionService implements OnDestroy {

  public lastBlockNumberSynced: number;
  private _intervals: NodeJS.Timer[];
  private _remote: boolean;
  constructor(
    private settingsService: SettingsService,
    private transactionSyncService: TransactionSyncService,
    private transactionRemoteService: TransactionRemoteService,
  ) {
    this._intervals = [];
    this._intervals.push(
      setInterval(async () => {
        const settings = await this.settingsService.getSettings();
        this._remote = settings.transactionSource === 'remote';
      }, 2000));
    this._intervals.push(
      setInterval(() => {
        this.lastBlockNumberSynced = this.transactionSyncService.lastBlockNumberSynced;
      }, 2000));
  }

  ngOnDestroy() {
    this._intervals.forEach(timer => clearInterval(timer));
  }

  public get displayTransactions(): boolean {
    if (this._remote) {
      return true;
    }
    return this.transactionSyncService.displayTransactions;
  }

  public async getTransactionsForAddress(address: string): Promise<AkromaTx[]> {
    if (this._remote) {
      return await this.getRemoteTransactionsForAddress(address);
    }
    console.log(`TransactionService: getting LOCAL for: ${address}`);
    return await this.getLocalTransactionsForAddress(address);
  }

  public async getRemoteTransactionsForAddress(address: string): Promise<AkromaTx[]> {
    // get transactions from remote api.
    console.log(`TransactionService: getting REMOTE for: ${address}`);
    return null;
  }

  public async getLocalTransactionsForAddress(address: string): Promise<AkromaTx[]> {
    // get transactions from remote api.
    return await this.transactionSyncService.getTransactionsForAddress(address);
  }

  // async getSingleTransactionByHash(txHash: string): Promise<Transaction> {
  //   return this.eth.getTransactionReceipt(txHash);
  // }

  // async getTransactionsByAccount(myAccount: string, startBlockNumber: number, endBlockNumber: number): Promise<Transaction[]> {
  //   const accountTransactions: Transaction[] = [];
  //   if (endBlockNumber == null) {
  //     endBlockNumber = await this.eth.getBlockNumber();
  //   }
  //   if (startBlockNumber == null) {
  //     startBlockNumber = endBlockNumber - 1000;
  //   }

  //   if (startBlockNumber < 0) {
  //     startBlockNumber = 0;
  //   }

  //   for (let i = startBlockNumber; i <= endBlockNumber; i++) {
  //     const block = await this.eth.getBlock(i, true);
  //     if (block != null && block.transactions != null) {
  //       block.transactions.forEach((transaction: Transaction) => {
  //         if (myAccount === '*' || myAccount === transaction.from || myAccount === transaction.to) {
  //           accountTransactions.push({
  //             ...transaction,
  //             timestamp: 1000 * block.timestamp,
  //             _id: transaction.hash,
  //           });
  //         }
  //       });
  //     }
  //   }
  //   return accountTransactions;
  // }
}
