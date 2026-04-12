import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditeSettingsPage } from './audite-settings-page';

describe('AuditeSettingsPage', () => {
  let component: AuditeSettingsPage;
  let fixture: ComponentFixture<AuditeSettingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditeSettingsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditeSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
