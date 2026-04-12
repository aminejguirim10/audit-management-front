import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAuditsPage } from './admin-audits-page';

describe('AdminAuditsPage', () => {
  let component: AdminAuditsPage;
  let fixture: ComponentFixture<AdminAuditsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
