import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';
import { Wallet } from '../models/wallet';

@Injectable()
export class WalletPersistenceService {
  private _db: PouchDB.Database<Wallet>;

  get db(): PouchDB.Database<Wallet> {
    return this._db;
  }

  constructor() {
    this._db = new PouchDB('wallets');
  }
}
