import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditPeopleListDialogComponent } from './edit-people-list-dialog.component';

describe('EditPeopleListComponent', () => {
  let component: EditPeopleListDialogComponent;
  let fixture: ComponentFixture<EditPeopleListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditPeopleListDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPeopleListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
