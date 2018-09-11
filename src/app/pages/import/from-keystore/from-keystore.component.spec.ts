import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FromKeystoreComponent } from './from-keystore.component';


describe('FromKeystoreComponent', () => {
  let component: FromKeystoreComponent;
  let fixture: ComponentFixture<FromKeystoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FromKeystoreComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FromKeystoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
