import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeDashboardPage } from './audite-dashboard-page';

describe('AuditeDashboardPage', () => {
  let component: AuditeDashboardPage;
  let fixture: ComponentFixture<AuditeDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
