import { Injectable, OnDestroy, OnInit } from '@angular/core';
import PouchDB, { emit } from 'pouchdb';
import { Block } from 'web3/types';
import { AkromaBlock } from '../models/akroma-block';
import { AkromaSyncState } from '../models/akroma-sync-state';
import { AkromaTx } from '../models/akroma-tx';
import { Web3Service } from './web3.service';


@Injectable()
export class ImportService implements OnDestroy, OnInit {
    public transactions: PouchDB.Database<AkromaTx>;
    public blocks: PouchDB.Database<AkromaBlock>;
    public syncState: PouchDB.Database<AkromaSyncState>;
    lastSyncState: AkromaSyncState = {
        _id: 'akroma-sync-state',
        currentBlock: 0, // last block saved
    };
    intervals: NodeJS.Timer[];
    // transaction syncing
    lastBlockNumberSynced: number;
    running: boolean;
    isPaused: boolean;
    index: number;
    BATCH_SIZE = 1000;
    // blockchain syncing
    blockNumber: number;
    connected: boolean;
    syncing: boolean;
    peerCount: number;
    status = 'starting....';
    constructor(
        private web3Service: Web3Service,
    ) {
        this.transactions = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-tx');
        this.blocks = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-blocks');
        this.syncState = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-sync');
        this.intervals = [];
        this.ensureIndexes();
    }

    private ensureIndexes() {
        const toFrom: any = {
            _id: '_design/to-from',
            views: {
                index: {
                    map: function mapFun(doc) {
                        if (doc.to || doc.from) {
                            emit(doc);
                        }
                    }.toString(),
                },
            },
        };

        const db = new PouchDB('http://akroma:akroma@127.0.0.1:5984/akroma-tx');
        // save the design doc
        db.put(toFrom).catch(function (err) {
            if (err.name !== 'conflict') {
                throw err;
            }
            // ignore if doc already exists
        });
        db.query('to-from', {
            limit: 0, // don't return any results
        }).then(function (res) {
            console.log('index was build!');
            console.log(res);
        }).catch(function (err) {
            console.error(err);
        });
    }

    // async getTransactionsByAccount(account: string): Promise<AkromaTx[]> {

    // }

    public PauseSync() {
        this.intervals.forEach(timer => clearInterval(timer));
        this.intervals = [];
        this.isPaused = true;
    }

    public StartSync() {
        this.intervals.push(
            setInterval(() => {
                this.web3Service.eth.getBlockNumber()
                    .then(s => { this.blockNumber = s; })
                    .catch(console.error);
                this.web3Service.eth.net.isListening()
                    .then(s => { this.connected = s; })
                    .catch(console.error);
                this.web3Service.eth.isSyncing()
                    .then(s => { this.syncing = s; })
                    .catch(console.error);
                this.web3Service.eth.net.getPeerCount()
                    .then(s => { this.peerCount = s; })
                    .catch(console.error);
            }, 5000));
        this.intervals.push(
            setInterval(async () => {
                await this.executeSync();
            }, 2000));
        this.intervals.push(
            setInterval(async () => {
                await this.saveSyncState();
            }, 5000));
        this.isPaused = false;
    }

    public get percentComplete() {
        return (this.lastSyncState.currentBlock / this.blockNumber * 100);
    }

    public get displayTransactions(): boolean {
        return this.percentComplete > 99;
    }

    public get blockchainSynced(): boolean {
        return this.peerCount >= 3 && this.connected && !this.syncing && this.blockNumber >= 1500000;
    }

    private async executeSync() {
        if (this.running) {
            console.log('[Chain Importer] process already running');
            return;
        }
        this.lastSyncState = await this.getSyncState();
        if (!this.connected) {
            this.running = false;
            console.log('[Chain Importer] not connected to web3');
            return;
        }
        const isSyncing = await this.web3Service.eth.isSyncing();
        if (isSyncing) {
            this.running = false;
            console.log('[Chain Importer] syncing');
            return;
        }
        const peers = await this.web3Service.eth.net.getPeerCount();
        if (peers < 1) {
            this.running = false;
            console.log('[Chain Importer] no peers');
            return;
        }
        this.running = true;
        this.index = 0;
        await this.getBlock(this.lastSyncState.currentBlock);
    }

    async ngOnInit() {
    }

    private async getSyncState(): Promise<AkromaSyncState> {
        try {
            const state = await this.syncState.get('akroma-sync-state');
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
            await this.syncState.put({ ...this.lastSyncState });
        } catch (error) {
            if (error.name === 'conflict') {
                const toSave = await this.getSyncState();
                toSave.currentBlock = this.lastSyncState.currentBlock;
                await this.syncState.put(toSave);
            }
            console.warn(`unable to save sync state ${error.name}`);
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
            console.log('[Chain Importer] block number is null, sync"d');
            this.lastSyncState.currentBlock = blockNumber;
            await this.saveSyncState();
            return;
        }
        const writeBlockResult = await this.writeBlock(block);
        if (!writeBlockResult) {
            console.warn('[Chain Importer] unable to write block');
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
            const saved = await this.blocks.put(toSaveBlock);
            if (saved.ok) {
                return saved.ok;
            }
        } catch (e) {
            if (e.name === 'conflict') {
                // console.info(`conflict saving block ${unsavedBlock.number}`);
                return true;
            }
            console.warn('unable to save document');
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
        await this.transactions.bulkDocs(toSaveTransaction);
        return true;
    }

    ngOnDestroy() {
        this.intervals.forEach(timer => clearInterval(timer));
    }
}
