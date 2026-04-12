import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtudiantSubmitIdeaPage } from './etudiant-submit-idea-page';

describe('EtudiantSubmitIdeaPage', () => {
  let component: EtudiantSubmitIdeaPage;
  let fixture: ComponentFixture<EtudiantSubmitIdeaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtudiantSubmitIdeaPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EtudiantSubmitIdeaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
