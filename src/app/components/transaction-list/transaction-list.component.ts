import { Component, Input, OnInit } from '@angular/core';
import { AkromaTx } from '../../models/akroma-tx';
import { Transaction } from '../../models/transaction';
import { Wallet } from '../../models/wallet';
import { ImportService } from '../../providers/import.service';


@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  // @Input() lastBlockNumberSynced: number;
  // @Input() endBlockNumber: number;
  @Input() address: string;
  @Input() transactions: Transaction[];
  @Input() wallet: Wallet;

  filteredTransactions: Transaction[];
  filter: string;
  timestamp: string = new Date().toLocaleDateString();
  page: number;

  endBlockNumber: number;
  lastBlockNumberSynced: number;
  syncing: boolean;
  tx: AkromaTx[];

  constructor(
    public importService: ImportService,
  ) {
    this.page = 1;
    this.filter = 'all';
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (!!changes.transactions && changes.transactions.currentValue !== changes.transactions.previousValue) {
  //     this.filteredTransactions = [ ...this.transactions ];
  //     this.filteredTransactions.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
  //   }
  // }

  ngOnInit() {
    this.syncing = this.importService.displayTransactions;
    this.lastBlockNumberSynced = this.importService.lastBlockNumberSynced;
    this.endBlockNumber = this.importService.blockNumber;
    // this.tx = this.importService.transactions;
  }

  setFilter(filterType: string) {
    switch (filterType) {
      case 'sent':
        this.filter = filterType;
        this.filteredTransactions = [ ...this.transactions ]
          .filter(x => x.from.toUpperCase() === this.wallet.address.toUpperCase());
        break;
      case 'received':
        this.filter = filterType;
        this.filteredTransactions = [ ...this.transactions ]
          .filter(x => x.to.toUpperCase() === this.wallet.address.toUpperCase());
        break;
      default:
        this.filter = 'all';
        this.filteredTransactions = [ ...this.transactions ];
    }
    this.filteredTransactions = [ ...this.filteredTransactions ].sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
  }

}
