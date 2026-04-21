import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuditService } from '../../../../services/audit.service';
import { AuditeurHistoryPage } from './auditeur-history-page';

describe('AuditeurHistoryPage', () => {
  let component: AuditeurHistoryPage;
  let fixture: ComponentFixture<AuditeurHistoryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeurHistoryPage],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: () => of([]),
            findById: () =>
              of({
                title: 'Audit demo',
                status: 'TERMINEE',
                typeAuditName: 'Qualite',
                department: 'INFORMATIQUE',
                auditeName: 'Chef',
                auditeurName: 'Auditeur',
                dateDebut: '2026-01-01',
                dateFin: '2026-01-05',
                scoreTotal: 80,
                auditResult: 'VALIDE',
                questions: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeurHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
