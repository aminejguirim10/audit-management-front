import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeurStudentIdeasPage } from './auditeur-student-ideas-page';

describe('AuditeurStudentIdeasPage', () => {
  let component: AuditeurStudentIdeasPage;
  let fixture: ComponentFixture<AuditeurStudentIdeasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeurStudentIdeasPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeurStudentIdeasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
