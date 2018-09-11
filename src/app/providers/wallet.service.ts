import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Wallet } from '../models/wallet';

@Injectable()
export class WalletService {
  private _db: PouchDB.Database<Wallet>;

  public get db(): PouchDB.Database<Wallet> {
    return this._db;
  }

  public constructor() {
    this._db = new PouchDB('wallets');
  }
}
