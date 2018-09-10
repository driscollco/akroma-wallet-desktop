import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AkromaTx } from '../../models/akroma-tx';
import { TransactionService } from '../../providers/transaction.service';


@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit, OnChanges {
  @Input() address: string;

  transactions: AkromaTx[];
  filteredTransactions: AkromaTx[];
  filter: string;
  timestamp: string = new Date().toLocaleDateString();
  page: number;

  endBlockNumber: number;
  lastBlockNumberSynced: number;
  syncing: boolean;
  tx: AkromaTx[];

  constructor(
    public transactionsService: TransactionService,
  ) {
    this.page = 1;
    this.filter = 'all';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!changes.transactions && changes.transactions.currentValue !== changes.transactions.previousValue) {
      this.filteredTransactions = [...this.transactions];
      this.filteredTransactions.sort((a: AkromaTx, b: AkromaTx) => b.ts - a.ts);
    }
  }

  async ngOnInit() {
    this.syncing = this.transactionsService.displayTransactions;
    this.lastBlockNumberSynced = this.transactionsService.lastBlockNumberSynced;
    this.endBlockNumber = 0; // this.transactionsService.blockNumber;
    this.filteredTransactions = await this.transactionsService.getTransactionsForAddress(this.address);
    this.transactions = this.filteredTransactions; // save all transactions for later, so we can filter on them.
  }

  public isFrom(address: string): boolean {
    return this.address.toUpperCase() === address.toUpperCase();
  }

  public setFilter(filterType: string) {
    switch (filterType) {
      case 'sent':
        this.filter = filterType;
        this.filteredTransactions = [...this.transactions]
          .filter(x => x.addressfrom.toUpperCase() === this.address.toUpperCase());
        break;
      case 'received':
        this.filter = filterType;
        this.filteredTransactions = [...this.transactions]
          .filter(x => x.addressto.toUpperCase() === this.address.toUpperCase());
        break;
      default:
        this.filter = 'all';
        this.filteredTransactions = [...this.transactions];
    }
    this.filteredTransactions = [...this.filteredTransactions].sort((a: AkromaTx, b: AkromaTx) => b.ts - a.ts);
  }

}
