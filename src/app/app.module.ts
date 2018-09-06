import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
// NG Translate
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { PopoverModule, ProgressbarModule } from 'ngx-bootstrap';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import 'reflect-metadata';
import 'zone.js/dist/zone-mix';
import '../polyfills';
import { AppRoutingModule } from './app-routing.module';
// Components
import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { MastheadComponent } from './components/masthead/masthead.component';
import { SendTransactionComponent } from './components/send-transaction/send-transaction.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { WalletActionsComponent } from './components/wallet-actions/wallet-actions.component';
import { WalletComponent } from './components/wallet/wallet.component';
// Pages
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { WalletListComponent } from './pages/wallet-list/wallet-list.component';
import { SplashComponent } from './pages/splash/splash-page.component';
import { WalletDetailPageComponent } from './pages/wallet-detail/wallet-detail-page.component';
// Services
import { AkromaClientService } from './providers/akroma-client.service';
import { ElectronService } from './providers/electron.service';
import { SettingsPersistenceService } from './providers/settings-persistence.service';
import { TransactionsPersistenceService } from './providers/transactions-persistence.service';
import { TransactionsService } from './providers/transactions.service';
import { ImportService } from './providers/import.service';
import { WalletPersistenceService } from './providers/wallet-persistence.service';
import { Web3Service } from './providers/web3.service';
import { AkromaLoggerService } from './providers/akroma-logger.service';
import { ShowEtherPipe } from './pipes/show-ether.pipe';


import { DragulaModule } from 'ng2-dragula';
import { FrameActionComponent } from './components/frame-action/frame-action.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { CreateWalletComponent } from './pages/create-wallet/create-wallet.component';
import { FromKeystoreComponent } from './pages/import/from-keystore/from-keystore.component';
import { PageTitleComponent } from './components/page-title/page-title.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    SplashComponent,
    WalletDetailPageComponent,
    SettingsPageComponent,
    SendTransactionComponent,
    SplashComponent,
    TransactionListComponent,
    WalletComponent,
    WalletActionsComponent,
    WalletListComponent,
    MastheadComponent,
    FooterComponent,
    ShowEtherPipe,
    FromKeystoreComponent,
    FrameActionComponent,
    SideBarComponent,
    CreateWalletComponent,
    PageTitleComponent,
  ],
  imports: [
    DragulaModule.forRoot(),
    RouterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    NgxPaginationModule,
    Ng2SearchPipeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient],
      },
    }),
    ProgressbarModule.forRoot(),
    ModalModule.forRoot(),
    PopoverModule.forRoot(),
    NgxQRCodeModule,
  ],
  providers: [
    AkromaClientService,
    AkromaLoggerService,
    ElectronService,
    Web3Service,
    TransactionsService,
    ImportService,
    TransactionsPersistenceService,
    SettingsPersistenceService,
    WalletPersistenceService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
