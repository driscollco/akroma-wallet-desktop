import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AkromaTx } from '../models/akroma-tx';

/**
 * TransactionRemoteService communicates with akroma explorer (currently akroma.io but will soon be light client to explorer.akroma.io network)
 * Users can decide to use TransactionSyncService or TransactionRemoveService via settings.
 */

@Injectable()
export class TransactionRemoteService {

  public constructor(
    private http: HttpClient,
  ) { }

  public async getTransactionsForAddress(address: string, page: number = 0): Promise<AkromaTx[]> {
    const params = { params: new HttpParams().set('page', page.toString()) };
    const tx = await this.http
      .get<any>(`https://api.akroma.io/addresses/${address}/transactions`, params).toPromise();
    const result: AkromaTx[] = [];
    tx.transactions.forEach(element => {
      result.push({
        ...element,
        addressfrom: element.from,
        addressto: element.to,
        ts: element.timestamp,
      });
    });
    console.log(result);
    console.log('got transactions from remote...');
    return result;
  }
}
