import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { ISubscription } from 'rxjs/Subscription';
import { BlockSync } from '../../models/block-sync';
import { AkromaClientService, statusConstants } from '../../providers/akroma-client.service';
import { TransactionSyncService } from '../../providers/transaction.sync.service';
import { Web3Service } from '../../providers/web3.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
})
export class SplashComponent implements OnDestroy, OnInit {
  public lastPercentageSynced: number;
  public isSyncing: boolean | BlockSync;
  public isListening: boolean;
  public lastSynced: BlockSync;
  public peerCount: number;
  public intervals: NodeJS.Timer[];
  public clientStatusSubscription: ISubscription;

  public constructor(
    private router: Router,
    private clientService: AkromaClientService,
    private web3Service: Web3Service,
    private transactionSyncSQLService: TransactionSyncService,
  ) {
    this.intervals = [];
  }

  public ngOnInit() {
    this.clientStatusSubscription = IntervalObservable.create(1000)
      .pipe(mergeMap(() => Observable.of(this.clientService.status)))
      .pipe(distinctUntilChanged())
      .subscribe((status: string) => {
        if (status === statusConstants.DOWNLOADING) {
          return;
        }
        if (status === statusConstants.RUNNING) {
          this.startSyncingSubscriptions();
          this.clientStatusSubscription.unsubscribe();
        }
      });
  }

  private async startSyncingSubscriptions(): Promise<void> {
    this.intervals.push(
      setInterval(async () => {
        const blockchainSynced = this.transactionSyncSQLService.blockchainSynced;
        if (blockchainSynced) {
            const wallets = await this.web3Service.eth.personal.getAccounts();
          this.navigate(wallets);
        }
      }, 1000));
  }

  public async navigate(wallets) {
    if (wallets[0]) {
      console.warn(`found wallet data! :: splash page`);
      this.router.navigate(['/wallets']);
    } else {
      console.warn(`No wallets ! Go Create or try importing!`);
      this.router.navigate(['/create']);
    }
  }

  /**
   * remove timers when navigating away from page.
   */
  public ngOnDestroy() {
    setTimeout(() => {
      console.log('clear timers');
      this.intervals.forEach(timer => clearInterval(timer));
      this.intervals = [];
    }, 1000);
  }
}
