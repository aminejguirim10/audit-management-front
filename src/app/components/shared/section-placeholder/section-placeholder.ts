import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-placeholder',
  templateUrl: './section-placeholder.html',
  styleUrl: './section-placeholder.css',
})
export class SectionPlaceholder {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly description = input.required<string>();
  readonly badge = input<string>('');
}
