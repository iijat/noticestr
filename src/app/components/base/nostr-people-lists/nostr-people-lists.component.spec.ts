import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NostrPeopleListsComponent } from './nostr-people-lists.component';

describe('NostrPeopleListsComponent', () => {
  let component: NostrPeopleListsComponent;
  let fixture: ComponentFixture<NostrPeopleListsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NostrPeopleListsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NostrPeopleListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
