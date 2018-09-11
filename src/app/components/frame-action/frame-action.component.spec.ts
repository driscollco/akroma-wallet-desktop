import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FrameActionComponent } from './frame-action.component';


describe('FrameActionComponent', () => {
  let component: FrameActionComponent;
  let fixture: ComponentFixture<FrameActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FrameActionComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FrameActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
