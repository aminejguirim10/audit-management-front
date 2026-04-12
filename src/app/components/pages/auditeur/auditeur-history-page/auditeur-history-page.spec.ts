import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeurHistoryPage } from './auditeur-history-page';

describe('AuditeurHistoryPage', () => {
  let component: AuditeurHistoryPage;
  let fixture: ComponentFixture<AuditeurHistoryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeurHistoryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeurHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
