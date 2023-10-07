import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNewPeopleListComponent } from './create-new-people-list.component';

describe('CreateNewPeopleListComponent', () => {
  let component: CreateNewPeopleListComponent;
  let fixture: ComponentFixture<CreateNewPeopleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateNewPeopleListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNewPeopleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
