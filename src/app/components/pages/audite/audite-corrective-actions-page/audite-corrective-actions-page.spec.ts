import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeCorrectiveActionsPage } from './audite-corrective-actions-page';

describe('AuditeCorrectiveActionsPage', () => {
  let component: AuditeCorrectiveActionsPage;
  let fixture: ComponentFixture<AuditeCorrectiveActionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeCorrectiveActionsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeCorrectiveActionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
