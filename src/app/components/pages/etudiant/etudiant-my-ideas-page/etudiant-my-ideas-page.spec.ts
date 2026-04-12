import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtudiantMyIdeasPage } from './etudiant-my-ideas-page';

describe('EtudiantMyIdeasPage', () => {
  let component: EtudiantMyIdeasPage;
  let fixture: ComponentFixture<EtudiantMyIdeasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtudiantMyIdeasPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EtudiantMyIdeasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
