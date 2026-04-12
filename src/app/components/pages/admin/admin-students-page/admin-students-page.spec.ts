import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStudentsPage } from './admin-students-page';

describe('AdminStudentsPage', () => {
  let component: AdminStudentsPage;
  let fixture: ComponentFixture<AdminStudentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStudentsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminStudentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
