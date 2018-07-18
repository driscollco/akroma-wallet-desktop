import { Injectable } from '@angular/core';

import { Web3Service } from './web3.service';
import { Transaction } from '../models/transaction';

@Injectable()
export class TransactionsService extends Web3Service {

  async getSingleRawTransactionByHash(txHash: string): Promise<Transaction> {
    return this.eth.getTransactionReceipt(txHash);
  }

  async getTransactionsByAccount(myAccount: string, startBlockNumber: number, endBlockNumber: number): Promise<Transaction[]> {
    const accountTransactions: Transaction[] = [];
    if (endBlockNumber == null) {
      endBlockNumber = await this.eth.getBlockNumber();
    }
    if (startBlockNumber == null) {
      startBlockNumber = endBlockNumber - 1000;
    }

    if (startBlockNumber < 0) {
      startBlockNumber = 0;
    }

    for (let i = startBlockNumber; i <= endBlockNumber; i++) {
      const block = await this.eth.getBlock(i, true);
      if (block != null && block.transactions != null) {
        block.transactions.forEach((transaction: Transaction) => {
          if (myAccount === '*' || myAccount === transaction.from || myAccount === transaction.to) {
            accountTransactions.push({
              ...transaction,
              timestamp: 1000 * block.timestamp,
              _id: transaction.hash,
            });
          }
        });
      }
    }
    return accountTransactions;
  }

  async getTransactionsByAccounts(myAccounts: string[], startBlockNumber: number, endBlockNumber: number): Promise<Transaction[]> {
    const accountTransactions: Transaction[] = [];
    if (endBlockNumber == null) {
      endBlockNumber = await this.eth.getBlockNumber();
    }
    if (startBlockNumber == null) {
      startBlockNumber = endBlockNumber - 1000;
    }

    if (startBlockNumber < 0) {
      startBlockNumber = 0;
    }

    for (let i = startBlockNumber; i <= endBlockNumber; i++) {
      const block = await this.eth.getBlock(i, true);
      if (block != null && block.transactions != null) {
        block.transactions.forEach((transaction: Transaction) => {
          if (myAccounts.includes(transaction.from) || myAccounts.includes(transaction.to)) {
            accountTransactions.push({
              ...transaction,
              timestamp: 1000 * block.timestamp,
            });
          }
        });
      }
    }
    return accountTransactions;
  }
}
