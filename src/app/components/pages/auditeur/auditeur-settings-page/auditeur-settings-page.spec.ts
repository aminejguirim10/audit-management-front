import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeurSettingsPage } from './auditeur-settings-page';

describe('AuditeurSettingsPage', () => {
  let component: AuditeurSettingsPage;
  let fixture: ComponentFixture<AuditeurSettingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeurSettingsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeurSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
