import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAuditorsPage } from './admin-auditors-page';

describe('AdminAuditorsPage', () => {
  let component: AdminAuditorsPage;
  let fixture: ComponentFixture<AdminAuditorsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditorsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
