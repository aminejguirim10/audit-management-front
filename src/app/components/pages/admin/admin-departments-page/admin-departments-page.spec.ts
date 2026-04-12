import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDepartmentsPage } from './admin-departments-page';

describe('AdminDepartmentsPage', () => {
  let component: AdminDepartmentsPage;
  let fixture: ComponentFixture<AdminDepartmentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDepartmentsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDepartmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
