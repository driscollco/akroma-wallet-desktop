import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletDetailPageComponent } from './wallet-detail.component';

describe('WalletDetailPageComponent', () => {
  let component: WalletDetailPageComponent;
  let fixture: ComponentFixture<WalletDetailPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WalletDetailPageComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
