import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeurDashboardPage } from './auditeur-dashboard-page';

describe('AuditeurDashboardPage', () => {
  let component: AuditeurDashboardPage;
  let fixture: ComponentFixture<AuditeurDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeurDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeurDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
