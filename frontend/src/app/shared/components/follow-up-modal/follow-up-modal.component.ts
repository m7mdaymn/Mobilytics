import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-follow-up-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4" (click)="close()">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ i18n.t('store.requestFollowUp') }}</h3>
            <button (click)="close()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl">&times;</button>
          </div>

          <p class="text-sm text-[color:var(--color-text-muted)]">
            {{ i18n.t('store.followUpDesc') }} {{ itemTitle || i18n.t('store.followUpThisItem') }}.
          </p>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.phone') }} <span class="text-red-500">*</span></label>
              <input
                [(ngModel)]="phone"
                type="tel"
                placeholder="+20 1xx xxx xxxx"
                class="input-field"
                [class.input-error]="submitted && !phone.trim()" />
              @if (submitted && !phone.trim()) {
                <p class="text-xs text-red-500 mt-1">{{ i18n.t('store.followUpPhoneRequired') }}</p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.name') }}</label>
              <input [(ngModel)]="name" type="text" [placeholder]="i18n.t('store.followUpName')" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">{{ i18n.t('common.notes') }}</label>
              <textarea [(ngModel)]="message" rows="2" [placeholder]="i18n.t('store.followUpMessage')" class="input-field"></textarea>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button (click)="close()" class="btn-outline flex-1">{{ i18n.t('common.cancel') }}</button>
            <button (click)="submit()" class="btn-whatsapp flex-1 justify-center" [disabled]="loading">
              {{ loading ? i18n.t('store.followUpSending') : i18n.t('store.requestFollowUp') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class FollowUpModalComponent {
  @Input() open = false;
  @Input() itemId = '';
  @Input() itemTitle = '';
  @Output() closed = new EventEmitter<void>();

  phone = '';
  name = '';
  message = '';
  submitted = false;
  loading = false;

  readonly i18n = inject(I18nService);
  private readonly whatsappService = inject(WhatsAppService);
  private readonly toastService = inject(ToastService);

  close(): void {
    this.open = false;
    this.closed.emit();
    this.reset();
  }

  submit(): void {
    this.submitted = true;
    if (!this.phone.trim()) return;

    this.loading = true;
    this.whatsappService.sendFollowUp({
      phone: this.phone.trim(),
      name: this.name.trim() || undefined,
      message: this.message.trim() || undefined,
      targetItemId: this.itemId || undefined,
    }).subscribe({
      next: () => {
        this.toastService.success(this.i18n.t('store.followUpSuccess'));
        this.close();
        this.loading = false;
      },
      error: () => {
        this.toastService.error(this.i18n.t('store.followUpError'));
        this.loading = false;
      },
    });
  }

  private reset(): void {
    this.phone = '';
    this.name = '';
    this.message = '';
    this.submitted = false;
    this.loading = false;
  }
}
