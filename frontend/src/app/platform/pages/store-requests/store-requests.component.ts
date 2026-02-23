import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PlatformApiService } from '../../../core/services/platform-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { StoreRequest, RegistrationStatus } from '../../../core/models/platform.models';

@Component({
  selector: 'app-store-requests',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-slate-800">Store Requests (Leads)</h1>
        <div class="flex gap-2 items-center">
          <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" placeholder="Search by name, email..."
            class="px-4 py-2 border border-slate-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" class="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="">All Status</option>
            <option value="PendingApproval">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="OnHold">On Hold</option>
          </select>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button (click)="statusFilter = ''; applyFilter()" class="bg-white rounded-xl p-4 border border-slate-200 text-center hover:shadow-sm transition-shadow cursor-pointer">
          <p class="text-2xl font-bold text-slate-800">{{ totalCount() }}</p>
          <p class="text-xs text-slate-500">Total</p>
        </button>
        <button (click)="statusFilter = 'PendingApproval'; applyFilter()" class="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center hover:shadow-sm transition-shadow cursor-pointer">
          <p class="text-2xl font-bold text-amber-700">{{ pendingCount() }}</p>
          <p class="text-xs text-amber-600">Pending</p>
        </button>
        <button (click)="statusFilter = 'Approved'; applyFilter()" class="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center hover:shadow-sm transition-shadow cursor-pointer">
          <p class="text-2xl font-bold text-emerald-700">{{ approvedCount() }}</p>
          <p class="text-xs text-emerald-600">Approved</p>
        </button>
        <button (click)="statusFilter = 'Rejected'; applyFilter()" class="bg-red-50 rounded-xl p-4 border border-red-200 text-center hover:shadow-sm transition-shadow cursor-pointer">
          <p class="text-2xl font-bold text-red-700">{{ rejectedCount() }}</p>
          <p class="text-xs text-red-600">Rejected</p>
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        @if (loading()) {
          <div class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3 text-left font-semibold text-slate-700">Store</th>
                  <th class="px-5 py-3 text-left font-semibold text-slate-700">Owner</th>
                  <th class="px-5 py-3 text-left font-semibold text-slate-700">Contact</th>
                  <th class="px-5 py-3 text-center font-semibold text-slate-700">Status</th>
                  <th class="px-5 py-3 text-left font-semibold text-slate-700">Submitted</th>
                  <th class="px-5 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (req of filteredRequests(); track req.id) {
                  <tr class="hover:bg-slate-50 cursor-pointer" (click)="openDetail(req)">
                    <td class="px-5 py-4">
                      <div>
                        <p class="font-medium text-slate-800">{{ req.storeName }}</p>
                        <p class="text-xs text-slate-500">{{ req.category }} · {{ req.location }}</p>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <p class="text-slate-800">{{ req.ownerName }}</p>
                      <p class="text-xs text-slate-500">{{ req.email }}</p>
                    </td>
                    <td class="px-5 py-4">
                      <p class="text-slate-800">{{ req.phone }}</p>
                      <p class="text-xs text-slate-500">{{ req.numberOfStores }} store(s) · {{ req.source || 'Direct' }}</p>
                    </td>
                    <td class="px-5 py-4 text-center">
                      <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                        [class]="statusClass(req.status)">
                        {{ statusLabel(req.status) }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-slate-500 text-sm">
                      {{ req.submittedAt | date:'mediumDate' }}
                    </td>
                    <td class="px-5 py-4 text-right" (click)="$event.stopPropagation()">
                      <div class="flex items-center justify-end gap-1">
                        @if (req.status === 'PendingApproval' || req.status === 'OnHold') {
                          <button (click)="openActionModal(req, 'Approved')"
                                  class="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                            ✓ Approve
                          </button>
                          <button (click)="openActionModal(req, 'Rejected')"
                                  class="text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                            ✗ Reject
                          </button>
                          @if (req.status !== 'OnHold') {
                            <button (click)="openActionModal(req, 'OnHold')"
                                    class="text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg text-xs font-medium transition-colors">
                              ⏸ Hold
                            </button>
                          }
                        }
                        @if (req.status === 'Approved') {
                          <span class="text-xs text-emerald-600">✓ {{ req.approvedAt | date:'shortDate' }}</span>
                        }
                        @if (req.status === 'Rejected') {
                          <span class="text-xs text-red-500 max-w-[120px] truncate" [title]="req.rejectionReason || 'Rejected'">{{ req.rejectionReason || 'Rejected' }}</span>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-5 py-12 text-center text-slate-400">No store requests found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Action Modal (Approve/Reject/Hold with notes) -->
      @if (actionReq()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="actionReq.set(null)">
          <div class="absolute inset-0 bg-black/40"></div>
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md" (click)="$event.stopPropagation()">
            <div class="p-6 space-y-4">
              <h2 class="text-lg font-bold text-slate-800">
                {{ actionStatus === 'Approved' ? 'Approve' : actionStatus === 'Rejected' ? 'Reject' : 'Put on Hold' }}
                — {{ actionReq()!.storeName }}
              </h2>
              <p class="text-sm text-slate-500">
                {{ actionStatus === 'Approved' ? 'Approve this store request. The owner will be notified.' :
                   actionStatus === 'Rejected' ? 'Reject this store request. Please provide a reason.' :
                   'Put this request on hold for later review.' }}
              </p>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  {{ actionStatus === 'Rejected' ? 'Rejection Reason' : 'Notes' }}
                  {{ actionStatus === 'Rejected' ? '' : '(optional)' }}
                </label>
                <textarea [(ngModel)]="actionNotes" rows="3"
                  class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  [placeholder]="actionStatus === 'Rejected' ? 'Why is this request being rejected?' : 'Any notes...'"></textarea>
              </div>
              <div class="flex gap-3 justify-end">
                <button (click)="actionReq.set(null)" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button (click)="confirmAction()"
                  [disabled]="actionStatus === 'Rejected' && !actionNotes.trim()"
                  class="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
                  [class]="actionStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                           actionStatus === 'Rejected' ? 'bg-red-600 hover:bg-red-700' :
                           'bg-slate-600 hover:bg-slate-700'">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Detail Drawer -->
      @if (selected()) {
        <div class="fixed inset-0 z-50 flex justify-end" (click)="selected.set(null)">
          <div class="absolute inset-0 bg-black/30"></div>
          <div class="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 class="text-lg font-bold text-slate-800">{{ selected()!.storeName }}</h2>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" [class]="statusClass(selected()!.status)">
                  {{ statusLabel(selected()!.status) }}
                </span>
              </div>
              <button (click)="selected.set(null)" class="text-slate-400 hover:text-slate-600 text-xl p-1">✕</button>
            </div>
            <div class="p-6 space-y-5">
              <!-- Store Info -->
              <div>
                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Store Information</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><span class="text-slate-500 block text-xs">Store Name</span><span class="font-medium">{{ selected()!.storeName }}</span></div>
                  <div><span class="text-slate-500 block text-xs">Category</span><span>{{ selected()!.category }}</span></div>
                  <div><span class="text-slate-500 block text-xs">Location</span><span>{{ selected()!.location }}</span></div>
                  <div><span class="text-slate-500 block text-xs"># of Stores</span><span>{{ selected()!.numberOfStores }}</span></div>
                  <div><span class="text-slate-500 block text-xs">Monthly Revenue</span><span>{{ selected()!.monthlyRevenue || 'N/A' }}</span></div>
                  <div><span class="text-slate-500 block text-xs">Source</span><span>{{ selected()!.source || 'Direct' }}</span></div>
                </div>
              </div>

              <!-- Owner Info -->
              <div>
                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Owner Information</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div><span class="text-slate-500 block text-xs">Name</span><span class="font-medium">{{ selected()!.ownerName }}</span></div>
                  <div><span class="text-slate-500 block text-xs">Email</span><span>{{ selected()!.email }}</span></div>
                  <div class="col-span-2"><span class="text-slate-500 block text-xs">Phone</span><span>{{ selected()!.phone }}</span></div>
                </div>
              </div>

              <!-- Timeline -->
              <div>
                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Timeline</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-slate-400 rounded-full"></span>
                    <span class="text-slate-500">Submitted</span>
                    <span class="ml-auto text-slate-700">{{ selected()!.submittedAt | date:'medium' }}</span>
                  </div>
                  @if (selected()!.approvedAt) {
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span class="text-slate-500">Approved</span>
                      <span class="ml-auto text-slate-700">{{ selected()!.approvedAt | date:'medium' }}</span>
                    </div>
                  }
                </div>
              </div>

              @if (selected()!.approvalNotes) {
                <div>
                  <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</h3>
                  <p class="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{{ selected()!.approvalNotes }}</p>
                </div>
              }
              @if (selected()!.rejectionReason) {
                <div>
                  <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Rejection Reason</h3>
                  <p class="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{{ selected()!.rejectionReason }}</p>
                </div>
              }

              <!-- Actions in drawer -->
              @if (selected()!.status === 'PendingApproval' || selected()!.status === 'OnHold') {
                <div class="border-t border-slate-200 pt-4 flex gap-3">
                  <button (click)="approveFromDrawer()"
                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                    ✓ Approve
                  </button>
                  <button (click)="rejectFromDrawer()"
                    class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                    ✗ Reject
                  </button>
                </div>
              }

              <!-- WhatsApp / Call -->
              @if (selected()!.phone) {
                <div class="flex gap-3">
                  <a [href]="whatsAppLink(selected()!.phone)" target="_blank"
                    class="flex-1 text-center bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                    WhatsApp
                  </a>
                  <a [href]="'tel:' + selected()!.phone" class="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                    Call
                  </a>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class StoreRequestsComponent implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly toast = inject(ToastService);

  readonly allRequests = signal<StoreRequest[]>([]);
  readonly filteredRequests = signal<StoreRequest[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<StoreRequest | null>(null);
  readonly actionReq = signal<StoreRequest | null>(null);

  statusFilter = '';
  searchTerm = '';
  actionStatus = '';
  actionNotes = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.api.getStoreRequests().subscribe({
      next: data => {
        this.allRequests.set(data || []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.allRequests.set([]);
        this.filteredRequests.set([]);
        this.loading.set(false);
      },
    });
  }

  applyFilter(): void {
    let list = this.allRequests();
    if (this.statusFilter) {
      list = list.filter(r => r.status === this.statusFilter);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(r =>
        r.storeName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    }
    this.filteredRequests.set(list);
  }

  totalCount(): number { return this.allRequests().length; }
  pendingCount(): number { return this.allRequests().filter(r => r.status === 'PendingApproval').length; }
  approvedCount(): number { return this.allRequests().filter(r => r.status === 'Approved').length; }
  rejectedCount(): number { return this.allRequests().filter(r => r.status === 'Rejected').length; }

  statusClass(status: RegistrationStatus): string {
    switch (status) {
      case 'PendingApproval': return 'bg-amber-100 text-amber-700';
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'OnHold': return 'bg-slate-200 text-slate-600';
    }
  }

  statusLabel(status: RegistrationStatus): string {
    switch (status) {
      case 'PendingApproval': return 'Pending';
      case 'OnHold': return 'On Hold';
      default: return status;
    }
  }

  openDetail(req: StoreRequest): void {
    this.selected.set(req);
  }

  openActionModal(req: StoreRequest, status: string): void {
    this.actionReq.set(req);
    this.actionStatus = status;
    this.actionNotes = '';
  }

  confirmAction(): void {
    const req = this.actionReq();
    if (!req) return;
    this.api.updateStoreRequestStatus(req.id, {
      status: this.actionStatus,
      notes: this.actionNotes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success(`Request ${this.actionStatus === 'Approved' ? 'approved' : this.actionStatus === 'Rejected' ? 'rejected' : 'put on hold'}`);
        this.actionReq.set(null);
        this.loadAll();
      },
      error: (err: any) => this.toast.error(err?.message || 'Failed to update status'),
    });
  }

  whatsAppLink(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return 'https://wa.me/' + cleaned;
  }

  approveFromDrawer(): void {
    const req = this.selected();
    if (!req) return;
    this.selected.set(null);
    this.openActionModal(req, 'Approved');
  }

  rejectFromDrawer(): void {
    const req = this.selected();
    if (!req) return;
    this.selected.set(null);
    this.openActionModal(req, 'Rejected');
  }
}
