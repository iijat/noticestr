import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OwnRelayDialogComponent } from './own-relay-dialog.component';

describe('OwnRelayDialogComponent', () => {
  let component: OwnRelayDialogComponent;
  let fixture: ComponentFixture<OwnRelayDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OwnRelayDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnRelayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
