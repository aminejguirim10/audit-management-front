import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeAiAssistantPage } from './audite-ai-assistant-page';

describe('AuditeAiAssistantPage', () => {
  let component: AuditeAiAssistantPage;
  let fixture: ComponentFixture<AuditeAiAssistantPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeAiAssistantPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeAiAssistantPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
