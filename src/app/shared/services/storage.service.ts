import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { PouchEntity } from '../../models/pouch-entity';

export interface StorageOperationError {
  error: boolean;
  operation: string;
  message: string;
  context: any;
}

export interface DocMeta {
  doc?: PouchDB.Core.ExistingDocument<{} & PouchDB.Core.AllDocsMeta>;
  id: PouchDB.Core.DocumentId;
  key: PouchDB.Core.DocumentKey;
  value: {
      rev: PouchDB.Core.RevisionId;
      deleted?: boolean;
  }
}

@Injectable()
export class StorageService<T extends PouchEntity> {
  private idProperty: string;
  private db: PouchDB.Database<T>;
  constructor(storeName: string, idProperty: string) {
    if (!storeName || !idProperty) {
      throw new Error('StorageService Error: storeName and idProperty are required constructor arguments.');
    }
    this.idProperty = idProperty;
    this.db = new PouchDB(storeName);
  }

  async get(item: T | string, options?: PouchDB.Core.GetOptions): Promise<T | StorageOperationError> {
    try {
      return await this.db.get(!!item[this.idProperty] ? item[this.idProperty] : item, options);
    } catch {
      return {
        error: true,
        operation: 'get',
        message: 'Item could not be retrieved from storage.',
        context: item,
      };
    }
  }

  async getAll(options: PouchDB.Core.AllDocsWithKeyOptions | PouchDB.Core.AllDocsWithKeysOptions
    | PouchDB.Core.AllDocsWithinRangeOptions | PouchDB.Core.AllDocsOptions = {}): Promise<T[] | StorageOperationError> {
    try {
      const allDocsResult = await this.db.allDocs({ include_docs: true, ...options });
      return allDocsResult.rows.map(x => x.doc);
    } catch {
      return {
        error: true,
        operation: 'getAll',
        message: 'Items could not be retrieved from storage.',
        context: options,
      };
    }
  }

  async getDeleted(keys: string[]): Promise<DocMeta[] | StorageOperationError> {
    try {
      const allDocsResult = await this.db.allDocs({ include_docs: true, keys: keys });
      return allDocsResult.rows.filter(x => x.value && x.value.deleted);
    } catch {
      return {
        error: true,
        operation: 'getDeleted',
        message: 'Deleted items could not be retrieved from storage.',
        context: keys,
      };
    }
  }

  async put(item: T): Promise<T | StorageOperationError> {
    try {
      const getResult = await this.get(item);
      let itemToWrite: T;
      let result: PouchDB.Core.Response;
      if (!!getResult[this.idProperty]) {
        itemToWrite = Object.assign(getResult, item);
        result = await this.db.put(itemToWrite);
      } else {
        itemToWrite = item;
        result = await this.db.post(itemToWrite);
      }
      if (result.ok) {
        return Object.assign({ _id: result.id, _rev: result.rev }, item);
      }
    } catch {
      return {
        error: true,
        operation: 'put',
        message: 'Item could not be written to storage.',
        context: item,
      };
    }
  }

  async putMany(items: T[]): Promise<T[] | StorageOperationError> {
    try {
      const result = await this.db.bulkDocs(items);
      items.forEach(item => {
        const updatedItem = result.find(x => x.id === item[this.idProperty]);
        item = Object.assign(item, updatedItem);
      });
      return items;
    } catch {
      return {
        error: true,
        operation: 'putMany',
        message: 'Items could not be written to storage.',
        context: items,
      };
    }
  }

  async delete(item: T | string): Promise<PouchDB.Core.Response | StorageOperationError> {
    try {
      return await this.db.remove(item[this.idProperty] || item);
    } catch {
      return {
        error: true,
        operation: 'delete',
        message: 'Item could not be deleted from storage.',
        context: item,
      };
    }
  }
}
