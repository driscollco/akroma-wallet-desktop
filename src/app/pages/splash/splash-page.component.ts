import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { ISubscription } from 'rxjs/Subscription';
import { BlockSync } from '../../models/block-sync';
import { AkromaClientService, statusConstants } from '../../providers/akroma-client.service';
import { ImportService } from '../../providers/import.service';
import { Web3Service } from '../../providers/web3.service';

@Component({
  selector: 'app-splash-page',
  templateUrl: './splash-page.component.html',
  styleUrls: ['./splash-page.component.scss'],
})
export class SplashComponent implements OnDestroy, OnInit {
  lastPercentageSynced: number;
  isSyncing: boolean | BlockSync;
  isListening: boolean;
  lastSynced: BlockSync;
  peerCount: number;
  wallets: any;
  intervals: NodeJS.Timer[];
  clientStatusSubscription: ISubscription;

  constructor(
    private router: Router,
    private clientService: AkromaClientService,
    private web3Service: Web3Service,
    private importService: ImportService,
  ) {
    this.intervals = [];
  }

  ngOnInit() {
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
        const blockchainSynced = this.importService.blockchainSynced;
        if (blockchainSynced) {
          const wallets = await this.web3Service.eth.personal.getAccounts();
          await this.navigate(wallets);
        }
      }, 1000));
  }

  async navigate(wallets) {
    if (wallets[0]) {
      console.warn(`found wallet data!`);
      this.router.navigate(['/wallets']);
    } else {
      console.warn(`No wallets ! Go Create or try importing!`);
      this.router.navigate(['/create']);
    }
  }

  /**
   * remove timers when navigating away from page.
   */
  ngOnDestroy() {
    this.intervals.forEach(timer => clearInterval(timer));
  }
}
