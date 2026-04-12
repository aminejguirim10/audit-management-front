import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAuditTypesPage } from './admin-audit-types-page';

describe('AdminAuditTypesPage', () => {
  let component: AdminAuditTypesPage;
  let fixture: ComponentFixture<AdminAuditTypesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditTypesPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditTypesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
