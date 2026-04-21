import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuditService } from '../../../../services/audit.service';
import { ReponseService } from '../../../../services/reponse.service';
import { AuditeDashboardPage } from './audite-dashboard-page';

describe('AuditeDashboardPage', () => {
  let component: AuditeDashboardPage;
  let fixture: ComponentFixture<AuditeDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeDashboardPage],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: () => of([]),
            findById: () =>
              of({
                title: 'Audit demo',
                status: 'EN_COURS',
                typeAuditName: 'Qualite',
                department: 'INFORMATIQUE',
                auditeName: 'Chef',
                auditeurName: 'Auditeur',
                dateDebut: '2026-01-01',
                dateFin: '2026-01-05',
                scoreTotal: 0,
                auditResult: null,
                questions: [],
              }),
          },
        },
        {
          provide: ReponseService,
          useValue: {
            add: () => of(undefined),
            update: () => of(undefined),
          },
        },
        {
          provide: ToastrService,
          useValue: {
            success: () => undefined,
            error: () => undefined,
            info: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
