import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { signal } from '@angular/core';

interface StoreRegistration {
  id: string;
  storeName: string;
  category: string;
  location: string;
  ownerName: string;
  email: string;
  phone: string;
  numberOfStores: string;
  monthlyRevenue?: string;
  source?: string;
  status: 'PendingApproval' | 'Approved' | 'Rejected' | 'OnHold';
  submittedAt: string;
  approvalNotes?: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-store-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-8">
          <h1 class="text-3xl font-bold text-gray-900">Store Registration Approvals</h1>
          <p class="text-gray-600 mt-2">Manage new store registration requests</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex gap-8">
            <button
              (click)="setActiveTab('pending')"
              [class.border-blue-600]="activeTab() === 'pending'"
              [class.text-blue-600]="activeTab() === 'pending'"
              [class.text-gray-600]="activeTab() !== 'pending'"
              class="py-4 px-1 border-b-2 border-transparent font-semibold transition">
              Pending ({{ pendingCount() }})
            </button>
            <button
              (click)="setActiveTab('approved')"
              [class.border-emerald-600]="activeTab() === 'approved'"
              [class.text-emerald-600]="activeTab() === 'approved'"
              [class.text-gray-600]="activeTab() !== 'approved'"
              class="py-4 px-1 border-b-2 border-transparent font-semibold transition">
              Approved
            </button>
            <button
              (click)="setActiveTab('rejected')"
              [class.border-red-600]="activeTab() === 'rejected'"
              [class.text-red-600]="activeTab() !== 'rejected'"
              [class.text-gray-600]="activeTab() !== 'rejected'"
              class="py-4 px-1 border-b-2 border-transparent font-semibold transition">
              Rejected
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- Loading State -->
        <div *ngIf="isLoading()" class="text-center py-12">
          <div class="inline-block">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p class="text-gray-600 mt-4">Loading registrations...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading() && registrations().length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-gray-600 text-lg">No {{ activeTab() }} registrations</p>
        </div>

        <!-- Registration Cards -->
        <div *ngIf="!isLoading() && registrations().length > 0" class="space-y-4">
          <div *ngFor="let reg of registrations()" class="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition">
            <!-- Card Header -->
            <div class="p-6 border-b border-gray-200 flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-bold text-gray-900">{{ reg.storeName }}</h3>
                  <span [class]="getStatusBadgeClass(reg.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ getStatusLabel(reg.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600">{{ reg.category }} • {{ reg.location }}</p>
              </div>
              <div class="text-right text-sm text-gray-600">
                <p class="font-semibold">{{ reg.ownerName }}</p>
                <p>{{ reg.email }}</p>
                <p>{{ reg.phone }}</p>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200">
              <div>
                <p class="text-xs text-gray-500 font-semibold mb-1">NUMBER OF STORES</p>
                <p class="text-lg font-bold text-gray-900">{{ reg.numberOfStores }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-semibold mb-1">EXPECTED REVENUE</p>
                <p class="text-lg font-bold text-gray-900">{{ reg.monthlyRevenue || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-semibold mb-1">SOURCE</p>
                <p class="text-lg font-bold text-gray-900">{{ reg.source || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-semibold mb-1">SUBMITTED</p>
                <p class="text-lg font-bold text-gray-900">{{ formatDate(reg.submittedAt) }}</p>
              </div>
            </div>

            <!-- Notes Section -->
            <div *ngIf="reg.approvalNotes || reg.rejectionReason" class="p-6 border-b border-gray-200 bg-gray-50">
              <p class="text-xs text-gray-500 font-semibold mb-2">NOTES:</p>
              <p class="text-gray-700">{{ reg.approvalNotes || reg.rejectionReason }}</p>
            </div>

            <!-- Actions -->
            <div *ngIf="activeTab() === 'pending'" class="p-6 flex gap-3">
              <button
                (click)="openApprovalModal(reg)"
                class="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition">
                ✓ Approve
              </button>
              <button
                (click)="openRejectionModal(reg)"
                class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                ✕ Reject
              </button>
              <button
                (click)="openHoldModal(reg)"
                class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                ⏸ Hold
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approval Modal -->
    <div *ngIf="showApprovalModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900">Approve Store</h2>
          <p class="text-gray-600 text-sm mt-1">{{ selectedRegistration()?.storeName }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Approval Notes (Optional)</label>
            <textarea
              [(ngModel)]="approvalNotes"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows="3"
              placeholder="e.g., Great business plan, verified documents..."></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex gap-3">
          <button
            (click)="closeApprovalModal()"
            class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
            Cancel
          </button>
          <button
            (click)="submitApproval()"
            [disabled]="isProcessing()"
            class="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold transition">
            {{ isProcessing() ? 'Processing...' : 'Approve' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Rejection Modal -->
    <div *ngIf="showRejectionModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900">Reject Store</h2>
          <p class="text-gray-600 text-sm mt-1">{{ selectedRegistration()?.storeName }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason *</label>
            <textarea
              [(ngModel)]="rejectionReason"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="3"
              placeholder="Why are you rejecting this application?"></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex gap-3">
          <button
            (click)="closeRejectionModal()"
            class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
            Cancel
          </button>
          <button
            (click)="submitRejection()"
            [disabled]="!rejectionReason || isProcessing()"
            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold transition">
            {{ isProcessing() ? 'Processing...' : 'Reject' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Hold Modal -->
    <div *ngIf="showHoldModal()" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900">Put On Hold</h2>
          <p class="text-gray-600 text-sm mt-1">{{ selectedRegistration()?.storeName }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Hold Reason (Optional)</label>
            <textarea
              [(ngModel)]="holdReason"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows="3"
              placeholder="e.g., Awaiting verification... Needs more documentation..."></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-gray-200 flex gap-3">
          <button
            (click)="closeHoldModal()"
            class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
            Cancel
          </button>
          <button
            (click)="submitHold()"
            [disabled]="isProcessing()"
            class="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-semibold transition">
            {{ isProcessing() ? 'Processing...' : 'Put On Hold' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class StoreApprovalsComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  // State
  activeTab = signal<'pending' | 'approved' | 'rejected'>('pending');
  isLoading = signal(false);
  isProcessing = signal(false);
  registrations = signal<StoreRegistration[]>([]);
  pendingCount = signal(0);

  // Modal States
  showApprovalModal = signal(false);
  showRejectionModal = signal(false);
  showHoldModal = signal(false);
  selectedRegistration = signal<StoreRegistration | null>(null);

  // Form Data
  approvalNotes = '';
  rejectionReason = '';
  holdReason = '';

  ngOnInit(): void {
    this.loadRegistrations();
  }

  setActiveTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab.set(tab);
    this.loadRegistrations();
  }

  private loadRegistrations(): void {
    this.isLoading.set(true);

    let endpoint = '/api/v1.0/stores';

    if (this.activeTab() === 'pending') {
      endpoint = '/api/v1.0/stores/pending';
    }

    this.apiService.get<StoreRegistration[]>(endpoint).subscribe({
      next: (data) => {
        const filtered = data.filter(reg => {
          if (this.activeTab() === 'pending') return reg.status === 'PendingApproval';
          if (this.activeTab() === 'approved') return reg.status === 'Approved';
          if (this.activeTab() === 'rejected') return reg.status === 'Rejected';
          return true;
        });

        this.registrations.set(filtered);
        this.pendingCount.set(data.filter(r => r.status === 'PendingApproval').length);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openApprovalModal(reg: StoreRegistration): void {
    this.selectedRegistration.set(reg);
    this.approvalNotes = '';
    this.showApprovalModal.set(true);
  }

  closeApprovalModal(): void {
    this.showApprovalModal.set(false);
    this.selectedRegistration.set(null);
    this.approvalNotes = '';
  }

  submitApproval(): void {
    const reg = this.selectedRegistration();
    if (!reg) return;

    this.isProcessing.set(true);
    this.apiService.post(`/api/v1.0/stores/${reg.id}/approve`, {
      approvalNotes: this.approvalNotes
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeApprovalModal();
        this.loadRegistrations();
      },
      error: () => {
        this.isProcessing.set(false);
      }
    });
  }

  openRejectionModal(reg: StoreRegistration): void {
    this.selectedRegistration.set(reg);
    this.rejectionReason = '';
    this.showRejectionModal.set(true);
  }

  closeRejectionModal(): void {
    this.showRejectionModal.set(false);
    this.selectedRegistration.set(null);
    this.rejectionReason = '';
  }

  submitRejection(): void {
    const reg = this.selectedRegistration();
    if (!reg || !this.rejectionReason) return;

    this.isProcessing.set(true);
    this.apiService.post(`/api/v1.0/stores/${reg.id}/reject`, {
      rejectionReason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeRejectionModal();
        this.loadRegistrations();
      },
      error: () => {
        this.isProcessing.set(false);
      }
    });
  }

  openHoldModal(reg: StoreRegistration): void {
    this.selectedRegistration.set(reg);
    this.holdReason = '';
    this.showHoldModal.set(true);
  }

  closeHoldModal(): void {
    this.showHoldModal.set(false);
    this.selectedRegistration.set(null);
    this.holdReason = '';
  }

  submitHold(): void {
    const reg = this.selectedRegistration();
    if (!reg) return;

    this.isProcessing.set(true);
    this.apiService.post(`/api/v1.0/stores/${reg.id}/hold`, {
      approvalNotes: this.holdReason
    }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeHoldModal();
        this.loadRegistrations();
      },
      error: () => {
        this.isProcessing.set(false);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PendingApproval': 'Pending',
      'Approved': 'Approved',
      'Rejected': 'Rejected',
      'OnHold': 'On Hold'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PendingApproval': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-emerald-100 text-emerald-800',
      'Rejected': 'bg-red-100 text-red-800',
      'OnHold': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
