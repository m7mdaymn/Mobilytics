import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WhatsAppService } from '../../../core/services/whatsapp.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-follow-up-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4" (click)="close()">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold">Request Follow-up</h3>
            <button (click)="close()" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
          </div>

          <p class="text-sm text-[color:var(--color-text-muted)]">
            We'll message you on WhatsApp about {{ itemTitle || 'this item' }}.
          </p>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Phone <span class="text-red-500">*</span></label>
              <input
                [(ngModel)]="phone"
                type="tel"
                placeholder="+20 1xx xxx xxxx"
                class="input-field"
                [class.input-error]="submitted && !phone.trim()" />
              @if (submitted && !phone.trim()) {
                <p class="text-xs text-red-500 mt-1">Phone is required</p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Name</label>
              <input [(ngModel)]="name" type="text" placeholder="Your name (optional)" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Message</label>
              <textarea [(ngModel)]="message" rows="2" placeholder="Any additional info..." class="input-field"></textarea>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button (click)="close()" class="btn-outline flex-1">Cancel</button>
            <button (click)="submit()" class="btn-whatsapp flex-1 justify-center" [disabled]="loading">
              {{ loading ? 'Sending...' : 'Request Follow-up' }}
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
        this.toastService.success("We'll message you on WhatsApp!");
        this.close();
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to send request. Try again.');
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
