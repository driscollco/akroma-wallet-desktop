import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WalletListComponent } from './components/wallet-list/wallet-list.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { SplashComponent } from './pages/splash/splash-page.component';
import { WalletDetailPageComponent } from './pages/wallet-detail/wallet-detail-page.component';
import { FromKeystoreComponent} from './pages/import/from-keystore/from-keystore.component';
import{CreateWalletComponent} from './pages/create-wallet/create-wallet.component';


const routes: Routes = [

    {
        path: 'create',
        component: CreateWalletComponent,
    },
    {
        path: 'import',
        component: FromKeystoreComponent,
    },
    {
        path: 'settings',
        component: SettingsPageComponent,
    },
    {
        path: 'wallet/:address',
        component: WalletDetailPageComponent,
    },
    {
        path: 'wallets',
        component: WalletListComponent,
    },
    {
        path: '',
        component: SplashComponent,
    },
    { path: '**', redirectTo: 'wallets' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
