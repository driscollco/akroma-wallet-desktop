import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { Transaction } from '../../models/transaction';
import { Wallet } from '../../models/wallet';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnChanges, OnInit {
  @Input() lastBlockNumberSynced: number;
  @Input() endBlockNumber: number;
  @Input() transactions: Transaction[];
  @Input() pendingTransactions: Transaction[];
  @Input() wallet: Wallet;

  filteredTransactions: Transaction[];
  filter: string;
  timestamp: string = new Date().toLocaleDateString();
  page: number;

  constructor() {
    this.page = 1;
    this.filter = 'all';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!changes.transactions && changes.transactions.currentValue !== changes.transactions.previousValue) {
      this.filteredTransactions = [ ...this.transactions ];
      this.filteredTransactions.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
    }
    if (!!changes.pendingTransactions && changes.pendingTransactions.currentValue !== changes.pendingTransactions.previousValue) {
      this.filteredTransactions = [ ...this.pendingTransactions, ...this.filteredTransactions ];
    }
  }

  ngOnInit() {
  }

  setFilter(filterType: string) {
    switch (filterType) {
      case 'sent':
        this.filter = filterType;
        this.filteredTransactions = [
          ...this.pendingTransactions,
          ...this.transactions
            .filter(x => x.from.toUpperCase() === this.wallet.address.toUpperCase()),
        ];
        break;
      case 'received':
        this.filteredTransactions = [
          ...this.transactions
            .filter(x => x.from.toUpperCase() === this.wallet.address.toUpperCase()),
          ...this.pendingTransactions,
        ];
        break;
      default:
        this.filter = 'all';
        this.filteredTransactions = [ ...this.pendingTransactions, ...this.transactions ];
    }
    this.filteredTransactions = [
      ...this.pendingTransactions,
      ...this.filteredTransactions.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp),
    ];
  }

}
