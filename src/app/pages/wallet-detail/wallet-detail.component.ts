import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Wallet } from '../../models/wallet';
import { LoggerService } from '../../providers/logger.service';
import { Web3Service } from '../../providers/web3.service';

@Component({
  selector: 'app-wallet-detail',
  templateUrl: './wallet-detail.component.html',
  styleUrls: ['./wallet-detail.component.scss'],
})
export class WalletDetailPageComponent implements OnDestroy, OnInit {
  public destroyed: boolean;
  public endBlockNumber: number;
  public lastBlockNumberSynced: number;
  public transactionSyncInterval: any;
  public syncing: boolean;
  public wallet: Wallet;
  public address: string;
  public constructor(
    private logger: LoggerService,
    private web3Service: Web3Service,
    private route: ActivatedRoute,
    private router: Router) {
    this.destroyed = false;
    this.syncing = false;
  }

  public async ngOnInit() {
    // const address = '0x41014cd8Ba3247a5299405dbB99A8D4aD21EE5F6';
    // this.address = '0x09033F3fF86F889602A57ED2c434B9D85642A0e2';
    // this.address = '0x621Ece09310Bd428679D617b1577b21A2962e385';
    this.address = this.route.snapshot.params.address;
    const balance = await this.web3Service.getBalance(this.address);
    this.wallet = {
      address: this.address,
      balance: balance,
    };
  }

  public ngOnDestroy() {
    this.destroyed = true;
  }
}
