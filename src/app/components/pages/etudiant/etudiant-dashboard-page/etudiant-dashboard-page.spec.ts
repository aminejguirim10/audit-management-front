import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtudiantDashboardPage } from './etudiant-dashboard-page';

describe('EtudiantDashboardPage', () => {
  let component: EtudiantDashboardPage;
  let fixture: ComponentFixture<EtudiantDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtudiantDashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EtudiantDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
