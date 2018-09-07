import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';

import { Transaction } from '../models/transaction';

/**
 * TransactionRemoteService communicates with akroma explorer (currently akroma.io but will soon be light client to explorer.akroma.io network)
 * Users can decide to use TransactionSyncService or TransactionRemoveService via settings.
 */

@Injectable()
export class TransactionRemoteService {
  private _db: PouchDB.Database<Transaction>;
  private _pending: PouchDB.Database<Transaction>;

  get db(): PouchDB.Database<Transaction> {
    return this._db;
  }

  get pending(): PouchDB.Database<Transaction> {
    return this._pending;
  }

  constructor() {
    this._db = new PouchDB('http://akroma:akroma@127.0.0.1:5984/transactions');
    this._pending = new PouchDB('http://akroma:akroma@127.0.0.1:5984/pending_transactions');
  }
}
