import { Injectable, OnDestroy } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchdbFind from 'pouchdb-find';
import { Block } from 'web3/types';
import { AkromaBlock } from '../models/akroma-block';
import { AkromaSyncState } from '../models/akroma-sync-state';
import { AkromaTx } from '../models/akroma-tx';
import { SettingsService } from './settings.service';
import { Web3Service } from './web3.service';


/**
 * TransactionSyncService syncs all the transactions from the akroma blockchain to a local couchdb instance.
 * Users can decide to use TransactionSyncService or TransactionRemoveService via settings.
 */

@Injectable()
export class TransactionSyncService implements OnDestroy {

    private _transactions: PouchDB.Database<AkromaTx>;
    private _blocks: PouchDB.Database<AkromaBlock>;
    private _syncState: PouchDB.Database<AkromaSyncState>;
    private _intervals: NodeJS.Timer[];
    lastSyncState: AkromaSyncState = {
        _id: 'akroma-sync-state',
        currentBlock: 0, // last block saved
    };
    // transaction syncing
    lastBlockNumberSynced: number;
    running: boolean;
    isPaused: boolean;
    index: number;
    status = 'starting....';
    private BATCH_SIZE = 1000;
    constructor(
        private web3Service: Web3Service,
        private settingsService: SettingsService,
    ) {
        PouchDB.plugin(PouchdbFind);
        PouchDB.debug.enable('pouchdb:find');
        this._transactions = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-tx');
        this._blocks = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-blocks');
        this._syncState = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-sync');
        this._intervals = [];
        // this.ensureIndexes();
        // this.settingsService.settings
        //     .subscribe(settings => {
        //         if (settings.transactionSource === 'remote') {
        //             console.log('remote source. disable sync');
        //             this.pauseSync();
        //         } else {
        //             console.log('local source. enable');
        //             this.startSync();
        //         }
        //     });
    }

    /**
     * TODO: create indexes, this code does not yet work.
     */
    // private ensureIndexes() {
    //     const toFrom: any = {
    //         _id: '_design/to-from',
    //         views: {
    //             index: {
    //                 map: function mapFun(doc) {
    //                     if (doc.to || doc.from) {
    //                         emit(doc.hash, doc);
    //                     }
    //                 }.toString(),
    //             },
    //         },
    //     };

    //     const db = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-tx');
    //     //save the design doc
    //     db.put(toFrom).catch(function (err) {
    //         if (err.name !== 'conflict') {
    //             throw err;
    //         }
    //         // ignore if doc already exists
    //     });
    //     db.query('to-from', {
    //         limit: 0, // don't return any results
    //     }).then(function (res) {
    //         console.log('index was build!');
    //         console.log(res);
    //     }).catch(function (err) {
    //         console.error(err);
    //     });
    // }

    public pauseSync() {
        this._intervals.forEach(timer => clearInterval(timer));
        this._intervals = [];
        this.isPaused = true;
        console.log('pause sync called.');
    }

    public startSync() {
        console.log('start sync called.');
        // this._intervals.push(
        //     setInterval(async () => {
        //         await this.executeSync();
        //     }, 2000));
        // this._intervals.push(
        //     setInterval(async () => {
        //         await this.saveSyncState();
        //     }, 5000));
        // this.isPaused = false;
    }

    /**
     * Gets percent complete of transaction sync, not blockchain sync
     */
    public get percentComplete() {
        return (this.lastSyncState.currentBlock / this.web3Service.blockNumber * 100);
    }

    public get displayTransactions(): boolean {
        return this.percentComplete > 99;
    }

    public get blockchainSynced(): boolean {
        return this.web3Service.peerCount >= 3
            && this.web3Service.connected
            && !this.web3Service.syncing
            && this.web3Service.blockNumber >= 1500000;
    }

    async getTransactionsForAddress(address: string): Promise<AkromaTx[]> {
        console.log(`getting transactions from local cache for ${address}`);
        // const index = await this._transactions.createIndex({
        //     index: {
        //         fields: ['to', 'from'],
        //     },
        // });
        // const response = await this._transactions.find({
        //     selector: {
        //         $or: [
        //             { to: address }
        //             // ,{ from: { $eq: address } },
        //         ],
        //     },
        // });
        // return response.docs;
        return null;
    }

    private async executeSync() {
        if (this.running) {
            console.log('[TransactionSyncService] process already running');
            return;
        }
        this.lastSyncState = await this.getSyncState();
        if (!this.web3Service.connected) {
            this.running = false;
            console.log('[TransactionSyncService] not connected to web3');
            return;
        }
        const isSyncing = await this.web3Service.syncing;
        if (isSyncing) {
            this.running = false;
            console.log('[TransactionSyncService] syncing');
            return;
        }
        const peers = await this.web3Service.peerCount;
        if (peers < 1) {
            this.running = false;
            console.log('[TransactionSyncService] no peers');
            return;
        }
        this.running = true;
        this.index = 0;
        await this.getBlock(this.lastSyncState.currentBlock);
    }

    private async getSyncState(): Promise<AkromaSyncState> {
        try {
            const state = await this._syncState.get('akroma-sync-state');
            return state;
        } catch (err) {
            if (err.name === 'not_found') {
                const defaultState: AkromaSyncState = {
                    _id: 'akroma-sync-state',
                    currentBlock: 0,
                };
                return defaultState;
            } else { // hm, some other error
                throw err;
            }
        }
    }

    private async saveSyncState() {
        try {
            await this._syncState.put({ ...this.lastSyncState });
        } catch (error) {
            if (error.name === 'conflict') {
                const toSave = await this.getSyncState();
                toSave.currentBlock = this.lastSyncState.currentBlock;
                await this._syncState.put(toSave);
            }
            console.warn(`[TransactionSyncService] unable to save sync state ${error.name}`);
        }
        this.lastSyncState = await this.getSyncState();
    }

    private async getBlock(blockNumber: number) {
        this.index = this.index + 1;
        this.status = `importing block ${blockNumber}`;
        this.lastBlockNumberSynced = blockNumber;
        if (this.index - this.BATCH_SIZE >= 0) {
            await this.saveSyncState();
            this.running = false;
            return;
        }
        const block = await this.web3Service.eth.getBlock(blockNumber, true);
        if (block === null || block.number === null) {
            console.log('[TransactionSyncService] block number is null, sync"d');
            this.lastSyncState.currentBlock = blockNumber;
            await this.saveSyncState();
            return;
        }
        const writeBlockResult = await this.writeBlock(block);
        if (!writeBlockResult) {
            console.warn('[TransactionSyncService] unable to write block');
            return;
        }
        await this.writeBlockTransactions(block);
        const nextBlockNumber = block.number + 1;
        this.lastSyncState.currentBlock = nextBlockNumber;
        await this.getBlock(nextBlockNumber);
    }

    private async writeBlock(unsavedBlock: Block): Promise<boolean> {
        // console.info('saving block %s', unsavedBlock.number);
        const toSaveBlock: AkromaBlock = {
            _id: unsavedBlock.hash,
            number: unsavedBlock.number,
        };
        try {
            const saved = await this._blocks.put(toSaveBlock);
            if (saved.ok) {
                return saved.ok;
            }
        } catch (e) {
            if (e.name === 'conflict') {
                // console.info(`conflict saving block ${unsavedBlock.number}`);
                return true;
            }
            console.warn('[TransactionSyncService] unable to save document');
            console.error(e);
            return false;
        }
    }

    private async writeBlockTransactions(unsavedBlock: Block): Promise<boolean> {
        const toSaveTransaction = new Array();
        if (unsavedBlock.transactions.length === 0) {
            return true;
        }
        unsavedBlock.transactions.forEach(element => {
            const tran: AkromaTx = {
                _id: element.hash,
                blockNumber: Number(element.blockNumber),
                from: element.from,
                to: element.to,
                value: this.web3Service.utils.fromWei(element.value, 'ether').toString(),
                gas: Number(element.gas),
                gasPrice: element.gasPrice, // .toExponential(5),
                timestamp: Number(unsavedBlock.timestamp),
                input: element.input,
            };
            toSaveTransaction.push(tran);
        });
        await this._transactions.bulkDocs(toSaveTransaction);
        return true;
    }

    ngOnDestroy() {
        this._intervals.forEach(timer => clearInterval(timer));
    }
}
