import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsStore } from '../../../core/stores/settings.store';

@Component({
  selector: 'app-policies',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6 capitalize">{{ key() }}</h1>
      @if (content()) {
        <div class="prose max-w-none" [innerHTML]="content()"></div>
      } @else {
        <div class="text-center py-16 text-[color:var(--color-text-muted)]">
          <p>No content available for this page.</p>
        </div>
      }
    </div>
  `,
})
export class PoliciesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly settingsStore = inject(SettingsStore);

  readonly key = signal('');
  readonly content = signal('');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const key = params['key'];
      this.key.set(key);
      let policies: Record<string, string> = {};
      try { policies = this.settingsStore.settings()?.policiesJson ? JSON.parse(this.settingsStore.settings()!.policiesJson!) : {}; } catch {}
      this.content.set(policies[key] || '');
    });
  }
}
