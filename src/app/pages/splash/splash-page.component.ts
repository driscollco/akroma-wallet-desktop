import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import PouchDB from 'pouchdb';
import { ProgressbarConfig } from 'ngx-bootstrap/progressbar';

import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { IntervalObservable } from 'rxjs/observable/IntervalObservable';
import { distinctUntilChanged, mergeMap, retry } from 'rxjs/operators';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';

import { Web3Service } from '../../providers/web3.service';
import { AkromaClientService, statusConstants } from '../../providers/akroma-client.service';
import { clientConstants } from '../../providers/akroma-client.constants';
import { BlockSync } from '../../models/block-sync';

// such override allows to keep some initial values
export function getProgressbarConfig(): ProgressbarConfig {
  return Object.assign(new ProgressbarConfig(), { animate: true, striped: true, max: 100 });
}

@Component({
  selector: 'app-splash-page',
  templateUrl: './splash-page.component.html',
  styleUrls: ['./splash-page.component.scss'],
  providers: [{ provide: ProgressbarConfig, useFactory: getProgressbarConfig }],
})
export class SplashComponent implements OnDestroy, OnInit {
  clientStatus: string;
  lastPercentageSynced: number;
  isSyncing: boolean | BlockSync;
  isListening: boolean;
  lastSynced: BlockSync;
  peerCount: number;
  wallets: any;
  syncingOperationIntervals: NodeJS.Timer[];
  clientStatusSubscription: ISubscription;
  private blockSyncStore: PouchDB.Database<BlockSync>;

  constructor(private web3: Web3Service,
    private router: Router,
    private clientService: AkromaClientService) {
    this.web3.setProvider(new this.web3.providers.HttpProvider(clientConstants.connection.default));
    this.lastPercentageSynced = 0;
    this.clientStatus = '';
    this.blockSyncStore = new PouchDB('lastBlockSynced');
    this.syncingOperationIntervals = [];
    this.isListening = false;
    this.isSyncing = false;
  }

  ngOnInit() {
    this.clientStatusSubscription = IntervalObservable.create(1000)
      .pipe(mergeMap((i) => Observable.of(this.clientService.status)))
      .pipe(distinctUntilChanged())
      .subscribe((status: string) => {
        this.clientStatus = status;
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
    try {
      this.lastSynced = await this.blockSyncStore.get('lastSynced');
      this.calculateSyncState(this.lastSynced);
    } catch {
      const results = await this.blockSyncStore.put({
        _id: 'lastSynced',
        currentBlock: 0,
        highestBlock: 0,
        knownStates: 0,
        pulledStates: 0,
        startingBlock: 0,
      });
      if (results.ok) {
        this.lastSynced = await this.blockSyncStore.get('lastSynced');
        this.calculateSyncState(this.lastSynced);
      }
    }

    this.syncingOperationIntervals.push(
      setInterval(async () => {
        this.isListening = await this.web3.eth.net.isListening()
          .catch(x => {
            console.warn(`awaiting system`)

          })
      }, 1000),
      setInterval(async () => {
        let blockNumber;
        if (this.isListening) {
          this.isSyncing = await this.web3.eth.isSyncing();
          blockNumber = await this.web3.eth.getBlockNumber();
        }
        if (this.lastPercentageSynced >= 98 || (this.peerCount >= 3 && !this.isSyncing && blockNumber !== 0)) {
          
          this.wallets = await this.web3.eth.personal.getAccounts().catch(err => {

            console.warn(`retry: checking wallets`)
          })

          await this.whereToGo(this.wallets, this.router).catch(err => {
            console.warn(`awaiting whereToGo response`)

          })


        }
      }, 1000),
      setInterval(async () => {
        await this.updateLastSynced();
      }, 5000),
      setInterval(async () => {
        if (this.isListening) {
          this.peerCount = await this.web3.eth.net.getPeerCount();
        }
      }, 15000));
  }

  async updateLastSynced(): Promise<void> {
    await this.blockSyncStore.put({
      ...this.lastSynced,
    });
    this.lastSynced = await this.blockSyncStore.get('lastSynced');
  }

  calculateSyncState(blockSync: BlockSync) {
    this.lastSynced = {
      ...this.lastSynced,
      ...blockSync,
    };
    this.lastPercentageSynced = this.currentPercentage(this.lastSynced.currentBlock, this.lastSynced.highestBlock);
    return this.lastPercentageSynced;
  }

  currentPercentage(currentBlock: number, highestBlock: number): number {
    return currentBlock / highestBlock * 100;
  }

  hexToInt(hexValue: string): number {
    return parseInt(hexValue, 10);
  }


  async whereToGo(wallets, router) {

    if (wallets[0]) {
      console.warn(`found wallet data!`)
      router.navigate(['/this.wallets']);
    } else {

      console.warn(`No wallets ! Go Create or try importing!`)
      router.navigate(['/create']);
    }

  }

  ngOnDestroy() {
    this.syncingOperationIntervals.forEach(timer => clearInterval(timer));
    
  }
}
