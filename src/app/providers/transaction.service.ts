import { Injectable, OnDestroy } from '@angular/core';
import { AkromaTx } from '../models/akroma-tx';
import { SettingsService } from './settings.service';
import { TransactionRemoteService } from './transaction.remote.service';
import { TransactionSyncService } from './transaction.sync.service';
import { Web3Service } from './web3.service';

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
    private transactionRemoteService: TransactionRemoteService,
    private transactionSyncService: TransactionSyncService,
    private web3Service: Web3Service,
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

  public get percentComplete() {
    const p = (this.lastBlockNumberSynced / this.web3Service.blockNumber * 100);
    return p;
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


  /**
   * Gets transactions for address
   * @param address
   * @returns transactions for address
   * TODO: Normalize the value/display of the value in AKA.
   */
  public async getTransactionsForAddress(address: string): Promise<AkromaTx[]> {
    if (this._remote) {
      return await this.transactionRemoteService.getTransactionsForAddress(address);
    }
    console.log(`TransactionService: getting LOCAL for: ${address}`);
    return await this.transactionSyncService.getTransactionsForAddress(address);
  }
}
