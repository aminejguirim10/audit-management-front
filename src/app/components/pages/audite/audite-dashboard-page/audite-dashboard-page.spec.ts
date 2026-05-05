import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuditService } from '../../../../services/audit.service';
import { AiResponse, AiService } from '../../../../services/ai.service';
import { CorrectiveActionService } from '../../../../services/corrective-action.service';
import { ReponseService } from '../../../../services/reponse.service';
import { AuditeDashboardPage } from './audite-dashboard-page';

describe('AuditeDashboardPage', () => {
  let component: AuditeDashboardPage;
  let fixture: ComponentFixture<AuditeDashboardPage>;
  let auditServiceMock: jasmine.SpyObj<AuditService>;
  let reponseServiceMock: jasmine.SpyObj<ReponseService>;
  let toastrServiceMock: jasmine.SpyObj<ToastrService>;
  let routerMock: jasmine.SpyObj<Router>;
  let aiServiceMock: jasmine.SpyObj<AiService>;
  let correctiveActionServiceMock: jasmine.SpyObj<CorrectiveActionService>;

  beforeEach(async () => {
    auditServiceMock = jasmine.createSpyObj<AuditService>('AuditService', ['findAll', 'findById']);
    auditServiceMock.findAll.and.returnValue(of([]));
    auditServiceMock.findById.and.returnValue(
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
    );

    reponseServiceMock = jasmine.createSpyObj<ReponseService>('ReponseService', ['add', 'update']);
    reponseServiceMock.add.and.returnValue(of(undefined));
    reponseServiceMock.update.and.returnValue(of(undefined));

    toastrServiceMock = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'error',
      'info',
      'warning',
    ]);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    aiServiceMock = jasmine.createSpyObj<AiService>('AiService', ['analyzeFailedQuestions']);
    aiServiceMock.analyzeFailedQuestions.and.returnValue(
      of({ actions: [], totalQuestions: 0, generatedAt: '' } as AiResponse),
    );
    correctiveActionServiceMock = jasmine.createSpyObj<CorrectiveActionService>(
      'CorrectiveActionService',
      ['addCorrectiveAction'],
    );
    correctiveActionServiceMock.addCorrectiveAction.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [AuditeDashboardPage],
      providers: [
        { provide: AuditService, useValue: auditServiceMock },
        { provide: ReponseService, useValue: reponseServiceMock },
        { provide: ToastrService, useValue: toastrServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: AiService, useValue: aiServiceMock },
        { provide: CorrectiveActionService, useValue: correctiveActionServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit responses sequentially when many questions are answered', () => {
    const responseSubjects: Subject<void>[] = [];
    reponseServiceMock.add.and.callFake(() => {
      const subject = new Subject<void>();
      responseSubjects.push(subject);
      return subject.asObservable();
    });

    component.selectedAuditSummary.set({
      id: 42,
      title: 'Audit demo',
      status: 'EN_COURS',
      typeAuditName: 'Qualite',
      department: 'INFORMATIQUE',
      auditeName: 'Chef',
      auditeurName: 'Auditeur',
      dateDebut: '2026-01-01',
      dateFin: '2026-01-05',
      scoreTotal: 0,
      nombreQuestions: 2,
    });

    component.selectedAuditDetails.set({
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
      questions: [
        {
          id: 1,
          title: 'Question 1',
          options: [
            { id: 11, label: 'Oui', sortOrder: 1 },
            { id: 12, label: 'Non', sortOrder: 2 },
          ],
          reponseId: null,
          optionChoisieId: null,
          selectedOptionId: null,
          score: null,
        },
        {
          id: 2,
          title: 'Question 2',
          options: [
            { id: 21, label: 'Oui', sortOrder: 1 },
            { id: 22, label: 'Non', sortOrder: 2 },
          ],
          reponseId: null,
          optionChoisieId: null,
          selectedOptionId: null,
          score: null,
        },
      ],
    });

    component.draftSelections.set({
      1: { optionId: 11 },
      2: { optionId: 21 },
    });

    component.submitResponses();

    expect(reponseServiceMock.add.calls.count()).toBe(1);
    expect(responseSubjects.length).toBe(1);

    responseSubjects[0].next();
    responseSubjects[0].complete();

    expect(reponseServiceMock.add.calls.count()).toBe(2);
    expect(responseSubjects.length).toBe(2);

    responseSubjects[1].next();
    responseSubjects[1].complete();

    expect(toastrServiceMock.success).toHaveBeenCalledWith(
      'Toutes les reponses ont ete enregistrees avec succes.',
      'Succes',
    );
    expect(component.selectedAuditDetails()).toBeNull();
  });
});
