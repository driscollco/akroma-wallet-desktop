import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateWalletComponent } from './pages/create-wallet/create-wallet.component';
import { FromKeystoreComponent } from './pages/import/from-keystore/from-keystore.component';
import { SettingsPageComponent } from './pages/settings/settings.component';
import { SplashComponent } from './pages/splash/splash.component';
import { WalletDetailPageComponent } from './pages/wallet-detail/wallet-detail.component';
import { WalletListComponent } from './pages/wallet-list/wallet-list.component';


const routes: Routes = [
    { path: 'create', component: CreateWalletComponent, pathMatch: 'full' },
    { path: 'import', component: FromKeystoreComponent, pathMatch: 'full' },
    { path: 'settings', component: SettingsPageComponent, pathMatch: 'full' },
    //  { path: 'wallet/:address', component: WalletDetailPageComponent, pathMatch: 'full' },
    { path: 'wallet', component: WalletDetailPageComponent, pathMatch: 'full' },
    { path: 'wallets', component: WalletListComponent, pathMatch: 'full' },
    { path: '', component: SplashComponent, pathMatch: 'full' },
    { path: '**', redirectTo: 'wallets' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
