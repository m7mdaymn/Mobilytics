import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Employee, EmployeeAbsence } from '../../../core/models/item.models';
import { ALL_PERMISSIONS, PermissionKey } from '../../../core/models/auth.models';
import { SettingsStore } from '../../../core/stores/settings.store';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ i18n.t('employees.title') }}</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ i18n.t('employees.subtitle') }}</p>
        </div>
        <button (click)="openForm()"
          class="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ i18n.t('employees.addNew') }}
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 class="font-semibold text-lg text-gray-900">{{ editId() ? i18n.t('employees.editEmployee') : i18n.t('employees.newEmployee') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('employees.fullName') }} <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.name" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('employees.fullNamePlaceholder')" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('common.email') }} <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.email" type="email" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('employees.emailPlaceholder')" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('common.phone') }}</label>
              <input [(ngModel)]="form.phone" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('employees.phonePlaceholder')" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('employees.role') }}</label>
              <select [(ngModel)]="form.role" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10">
                <option value="Manager">{{ i18n.t('employees.roleManager') }}</option>
                <option value="Employee">{{ i18n.t('employees.roleEmployee') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('employees.salaryMonthly') }}</label>
              <input [(ngModel)]="form.salaryMonthly" type="number" min="0" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" />
            </div>
            @if (editId()) {
              <div class="flex items-center">
                <label class="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" [(ngModel)]="form.isActive" class="w-4 h-4 rounded accent-green-600" />
                  <span class="text-sm font-medium text-gray-700">{{ i18n.t('common.active') }}</span>
                </label>
              </div>
            }
            @if (!editId()) {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{{ i18n.t('common.password') }} <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.password" type="password" class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900/10" [placeholder]="i18n.t('employees.passwordPlaceholder')" />
              </div>
            }
          </div>

          <!-- Permissions -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700">{{ i18n.t('employees.permissions') }}</h3>
              <div class="flex gap-2">
                <button (click)="selectAllPerms()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">{{ i18n.t('employees.selectAll') }}</button>
                <span class="text-gray-300">|</span>
                <button (click)="clearAllPerms()" class="text-xs text-gray-500 hover:text-gray-700 font-medium">{{ i18n.t('employees.clearAll') }}</button>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              @for (perm of allPermissions; track perm) {
                <label class="flex items-center gap-2 text-sm px-3 py-2 rounded-lg cursor-pointer transition"
                  [class]="isPermissionEnabled(perm) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-white text-gray-600'">
                  <input type="checkbox" [checked]="isPermissionEnabled(perm)"
                    (change)="togglePermission(perm)" class="w-4 h-4 rounded accent-indigo-600" />
                  <span class="text-xs font-medium">{{ formatPermission(perm) }}</span>
                </label>
              }
            </div>
          </div>

          <div class="flex gap-2">
            <button (click)="saveEmployee()" [disabled]="saving()"
              class="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {{ saving() ? i18n.t('common.saving') : i18n.t('employees.saveEmployee') }}
            </button>
            <button (click)="showForm.set(false)" class="text-gray-500 hover:text-gray-900 px-4 py-2.5 text-sm font-medium transition">{{ i18n.t('common.cancel') }}</button>
          </div>
        </div>
      }

      <!-- Employees Table -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-5 py-3.5 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('employees.employeeCol') }}</th>
              <th class="px-5 py-3.5 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('employees.role') }}</th>
              <th class="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('common.status') }}</th>
              <th class="px-5 py-3.5 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('employees.salary') }}</th>
              <th class="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ i18n.t('employees.permissionsCol') }}</th>
              <th class="px-5 py-3.5 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (emp of employees(); track emp.id) {
              <tr class="hover:bg-gray-50/50 transition">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      [class]="emp.role === 'Owner' ? 'bg-purple-500' : emp.role === 'Manager' ? 'bg-indigo-500' : 'bg-gray-400'">
                      {{ emp.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ emp.name }}</p>
                      <p class="text-xs text-gray-400">{{ emp.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium"
                    [class]="emp.role === 'Owner' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20' :
                             emp.role === 'Manager' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                             'bg-gray-50 text-gray-600 ring-1 ring-gray-600/20'">
                    {{ emp.role }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <span class="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
                    [class]="emp.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
                    {{ emp.isActive ? i18n.t('common.active') : i18n.t('common.inactive') }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-end font-medium text-gray-900">
                  {{ emp.salaryMonthly | currency: settingsStore.currency() : 'symbol-narrow' : '1.0-0' }}
                </td>
                <td class="px-5 py-3.5 text-center">
                  @if (emp.role === 'Owner') {
                    <span class="text-xs text-purple-600 font-medium">{{ i18n.t('common.all') }}</span>
                  } @else {
                    <span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      [class]="countEnabledPerms(emp) > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'">
                      {{ countEnabledPerms(emp) }}/{{ allPermissions.length }}
                    </span>
                  }
                </td>
                <td class="px-5 py-3.5 text-end">
                  @if (emp.role !== 'Owner') {
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="editEmployee(emp)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition">{{ i18n.t('common.edit') }}</button>
                      <button (click)="deleteEmployee(emp)" class="text-red-500 hover:text-red-700 text-sm font-medium transition">{{ i18n.t('common.delete') }}</button>
                    </div>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-5 py-16 text-center">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
                  <p class="text-gray-400 font-medium">{{ i18n.t('employees.noData') }}</p>
                  <p class="text-xs text-gray-300 mt-1">{{ i18n.t('employees.emptyHint') }}</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Absence Management -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">إدارة الغياب</h2>
            <p class="text-xs text-gray-500 mt-1">تسجيل الغياب، تعديل الحالة، واعتماد أو رفض الأعذار</p>
          </div>
          <button (click)="openAbsenceForm()"
            class="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            إضافة غياب
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 rounded-xl p-3">
          <select [(ngModel)]="absenceFilters.employeeId" (ngModelChange)="loadAbsences()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">كل الموظفين</option>
            @for (emp of employees(); track emp.id) {
              <option [value]="emp.id">{{ emp.name }}</option>
            }
          </select>
          <input [(ngModel)]="absenceFilters.fromDate" (change)="loadAbsences()" type="date" class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input [(ngModel)]="absenceFilters.toDate" (change)="loadAbsences()" type="date" class="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <select [(ngModel)]="absenceFilters.status" (ngModelChange)="loadAbsences()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="approved">معتمد</option>
            <option value="rejected">مرفوض</option>
          </select>
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-lg bg-white border border-gray-200 px-2 py-2 text-center">
              <div class="text-xs text-gray-500">إجمالي</div>
              <div class="font-bold text-gray-900">{{ absences().length }}</div>
            </div>
            <div class="rounded-lg bg-white border border-green-200 px-2 py-2 text-center">
              <div class="text-xs text-green-700">معتمد</div>
              <div class="font-bold text-green-700">{{ approvedCount() }}</div>
            </div>
            <div class="rounded-lg bg-white border border-amber-200 px-2 py-2 text-center">
              <div class="text-xs text-amber-700">معلق</div>
              <div class="font-bold text-amber-700">{{ pendingCount() }}</div>
            </div>
          </div>
        </div>

        @if (showAbsenceForm()) {
          <div class="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-600 font-medium">الموظف <span class="text-red-500">*</span></label>
                <select [(ngModel)]="absenceForm.employeeId" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">اختر موظف</option>
                  @for (emp of employees(); track emp.id) {
                    <option [value]="emp.id">{{ emp.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-600 font-medium">تاريخ الغياب <span class="text-red-500">*</span></label>
                <input [(ngModel)]="absenceForm.absenceDate" type="date" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-600 font-medium">السبب <span class="text-red-500">*</span></label>
                <input [(ngModel)]="absenceForm.reason" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="سبب الغياب" />
              </div>
              <div class="flex items-end">
                <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="absenceForm.isExcused" class="w-4 h-4 accent-indigo-600" />
                  غياب بعذر (معتمد)
                </label>
              </div>
              <div class="md:col-span-2">
                <label class="text-xs text-gray-600 font-medium">ملاحظات</label>
                <textarea [(ngModel)]="absenceForm.notes" rows="2" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="ملاحظات إضافية"></textarea>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="saveAbsence()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">{{ editingAbsenceId() ? 'حفظ التعديل' : 'إضافة الغياب' }}</button>
              <button (click)="cancelAbsenceForm()" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800">إلغاء</button>
            </div>
          </div>
        }

        <div class="overflow-x-auto border border-gray-100 rounded-xl">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3 text-start">الموظف</th>
                <th class="px-4 py-3 text-start">التاريخ</th>
                <th class="px-4 py-3 text-start">السبب</th>
                <th class="px-4 py-3 text-start">الحالة</th>
                <th class="px-4 py-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (absenceLoading()) {
                <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">جاري تحميل الغيابات...</td></tr>
              } @else {
                @for (a of absences(); track a.id) {
                  <tr class="hover:bg-gray-50/70">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ a.employeeName }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ a.absenceDate | date:'yyyy-MM-dd' }}</td>
                    <td class="px-4 py-3 text-gray-600">
                      <div class="font-medium text-gray-800">{{ a.reason }}</div>
                      @if (a.notes) {
                        <div class="text-xs text-gray-400 mt-0.5">{{ a.notes }}</div>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        [class]="a.isExcused ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                        {{ a.isExcused ? 'معتمد' : 'معلق/مرفوض' }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-2">
                        @if (!a.isExcused) {
                          <button (click)="setAbsenceStatus(a, true)" class="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100">اعتماد</button>
                        }
                        @if (a.isExcused) {
                          <button (click)="setAbsenceStatus(a, false)" class="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100">رفض</button>
                        }
                        <button (click)="editAbsence(a)" class="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">تعديل</button>
                        <button (click)="deleteAbsence(a)" class="text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100">حذف</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">لا توجد بيانات غياب مطابقة للفلاتر.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class EmployeesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);
  readonly settingsStore = inject(SettingsStore);
  readonly i18n = inject(I18nService);

  readonly employees = signal<Employee[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly absences = signal<EmployeeAbsence[]>([]);
  readonly absenceLoading = signal(false);
  readonly showAbsenceForm = signal(false);
  readonly editingAbsenceId = signal<string | null>(null);

  readonly allPermissions = ALL_PERMISSIONS;

  readonly approvedCount = computed(() => this.absences().filter(a => a.isExcused).length);
  readonly pendingCount = computed(() => this.absences().filter(a => !a.isExcused).length);

  form: {
    name: string; email: string; phone: string; role: string;
    salaryMonthly: number; password: string; isActive: boolean; enabledPermissions: Set<PermissionKey>;
  } = {
    name: '', email: '', phone: '', role: 'Employee',
    salaryMonthly: 0, password: '', isActive: true, enabledPermissions: new Set(),
  };

  absenceForm: {
    employeeId: string;
    absenceDate: string;
    reason: string;
    notes: string;
    isExcused: boolean;
  } = {
    employeeId: '',
    absenceDate: '',
    reason: '',
    notes: '',
    isExcused: false,
  };

  absenceFilters: {
    employeeId: string;
    fromDate: string;
    toDate: string;
    status: '' | 'pending' | 'approved' | 'rejected';
  } = {
    employeeId: '',
    fromDate: '',
    toDate: '',
    status: '',
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<Employee[]>('/Employees').subscribe({
      next: d => {
        this.employees.set(d || []);
        this.loadAbsences();
      },
      error: () => this.toastService.error('Failed to load employees'),
    });
  }

  openForm(): void {
    this.form = { name: '', email: '', phone: '', role: 'Employee', salaryMonthly: 0, password: '', isActive: true, enabledPermissions: new Set() };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editEmployee(emp: Employee): void {
    const enabled = new Set<PermissionKey>(
      (emp.permissions || []).filter(p => p.isEnabled).map(p => p.key as PermissionKey)
    );
    this.form = {
      name: emp.name, email: emp.email, phone: emp.phone || '',
      role: emp.role, salaryMonthly: emp.salaryMonthly || 0, password: '',
      isActive: emp.isActive !== false, enabledPermissions: enabled,
    };
    this.editId.set(emp.id);
    this.showForm.set(true);
  }

  deleteEmployee(emp: Employee): void {
    if (!confirm(`Delete "${emp.name}"?`)) return;
    this.api.delete(`/Employees/${emp.id}`).subscribe({
      next: () => { this.toastService.success(this.i18n.t('employees.deleted')); this.load(); },
      error: () => this.toastService.error(this.i18n.t('employees.deleteFailed')),
    });
  }

  selectAllPerms(): void {
    this.allPermissions.forEach(p => this.form.enabledPermissions.add(p));
  }

  clearAllPerms(): void {
    this.form.enabledPermissions.clear();
  }

  isPermissionEnabled(perm: PermissionKey): boolean {
    return this.form.enabledPermissions.has(perm);
  }

  togglePermission(perm: PermissionKey): void {
    if (this.form.enabledPermissions.has(perm)) {
      this.form.enabledPermissions.delete(perm);
    } else {
      this.form.enabledPermissions.add(perm);
    }
  }

  formatPermission(perm: string): string {
    return perm.replace('.', ' › ').replace(/([A-Z])/g, ' $1').trim();
  }

  countEnabledPerms(emp: Employee): number {
    return (emp.permissions || []).filter(p => p.isEnabled).length;
  }

  saveEmployee(): void {
    if (!this.form.name || !this.form.email) {
      this.toastService.error(this.i18n.t('employees.nameEmailRequired'));
      return;
    }
    if (!this.editId() && !this.form.password) {
      this.toastService.error(this.i18n.t('employees.passwordRequired'));
      return;
    }
    this.saving.set(true);

    if (this.editId()) {
      // Update employee details
      const updateBody = {
        name: this.form.name, email: this.form.email, phone: this.form.phone,
        role: this.form.role, salaryMonthly: this.form.salaryMonthly, isActive: this.form.isActive,
      };
      this.api.put(`/Employees/${this.editId()}`, updateBody).subscribe({
        next: () => {
          // Then update permissions
          this.savePermissions(this.editId()!);
        },
        error: (err) => { this.saving.set(false); this.toastService.error(err.message || 'Failed'); },
      });
    } else {
      // Create new employee
      const createBody = {
        name: this.form.name, email: this.form.email, phone: this.form.phone,
        password: this.form.password, role: this.form.role,
        salaryMonthly: this.form.salaryMonthly,
      };
      this.api.post<Employee>('/Employees', createBody).subscribe({
        next: (emp) => {
          if (emp?.id) {
            this.savePermissions(emp.id);
          } else {
            this.saving.set(false); this.showForm.set(false);
            this.toastService.success(this.i18n.t('employees.saved')); this.load();
          }
        },
        error: (err) => { this.saving.set(false); this.toastService.error(err.message || this.i18n.t('employees.deleteFailed')); },
      });
    }
  }

  private savePermissions(employeeId: string): void {
    const permissions = this.allPermissions.map(key => ({
      key, isEnabled: this.form.enabledPermissions.has(key),
    }));
    this.api.put(`/Employees/${employeeId}/permissions`, { permissions }).subscribe({
      next: () => {
        this.saving.set(false); this.showForm.set(false);
        this.toastService.success(this.i18n.t('employees.saved')); this.load();
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error(this.i18n.t('employees.permsSaveFailed'));
        this.load();
      },
    });
  }

  loadAbsences(): void {
    const params: Record<string, string> = {};
    if (this.absenceFilters.employeeId) params['employeeId'] = this.absenceFilters.employeeId;
    if (this.absenceFilters.fromDate) params['fromDate'] = this.absenceFilters.fromDate;
    if (this.absenceFilters.toDate) params['toDate'] = this.absenceFilters.toDate;
    if (this.absenceFilters.status === 'approved') params['isExcused'] = 'true';
    if (this.absenceFilters.status === 'pending' || this.absenceFilters.status === 'rejected') params['isExcused'] = 'false';

    this.absenceLoading.set(true);
    this.api.get<EmployeeAbsence[]>('/Employees/absences', params).subscribe({
      next: data => {
        this.absences.set(data || []);
        this.absenceLoading.set(false);
      },
      error: () => {
        this.absenceLoading.set(false);
        this.toastService.error('Failed to load absences');
      },
    });
  }

  openAbsenceForm(): void {
    this.editingAbsenceId.set(null);
    this.absenceForm = {
      employeeId: '',
      absenceDate: new Date().toISOString().slice(0, 10),
      reason: '',
      notes: '',
      isExcused: false,
    };
    this.showAbsenceForm.set(true);
  }

  editAbsence(absence: EmployeeAbsence): void {
    this.editingAbsenceId.set(absence.id);
    this.absenceForm = {
      employeeId: absence.employeeId,
      absenceDate: absence.absenceDate.slice(0, 10),
      reason: absence.reason,
      notes: absence.notes || '',
      isExcused: absence.isExcused,
    };
    this.showAbsenceForm.set(true);
  }

  cancelAbsenceForm(): void {
    this.showAbsenceForm.set(false);
    this.editingAbsenceId.set(null);
  }

  saveAbsence(): void {
    if (!this.absenceForm.employeeId || !this.absenceForm.absenceDate || !this.absenceForm.reason.trim()) {
      this.toastService.error('Employee, date and reason are required');
      return;
    }

    const body = {
      employeeId: this.absenceForm.employeeId,
      absenceDate: this.absenceForm.absenceDate,
      reason: this.absenceForm.reason.trim(),
      notes: this.absenceForm.notes.trim() || null,
      isExcused: this.absenceForm.isExcused,
    };

    const request$ = this.editingAbsenceId()
      ? this.api.put(`/Employees/absences/${this.editingAbsenceId()}`, {
          absenceDate: body.absenceDate,
          reason: body.reason,
          notes: body.notes,
          isExcused: body.isExcused,
        })
      : this.api.post('/Employees/absences', body);

    request$.subscribe({
      next: () => {
        this.toastService.success(this.editingAbsenceId() ? 'Absence updated' : 'Absence added');
        this.cancelAbsenceForm();
        this.loadAbsences();
      },
      error: () => this.toastService.error('Failed to save absence'),
    });
  }

  setAbsenceStatus(absence: EmployeeAbsence, approved: boolean): void {
    this.api.put(`/Employees/absences/${absence.id}`, {
      absenceDate: absence.absenceDate,
      reason: absence.reason,
      notes: absence.notes,
      isExcused: approved,
    }).subscribe({
      next: () => {
        this.toastService.success(approved ? 'Absence approved' : 'Absence rejected');
        this.loadAbsences();
      },
      error: () => this.toastService.error('Failed to update absence status'),
    });
  }

  deleteAbsence(absence: EmployeeAbsence): void {
    if (!confirm(`Delete absence for "${absence.employeeName}" on ${absence.absenceDate.slice(0, 10)}?`)) return;
    this.api.delete(`/Employees/absences/${absence.id}`).subscribe({
      next: () => {
        this.toastService.success('Absence deleted');
        this.loadAbsences();
      },
      error: () => this.toastService.error('Failed to delete absence'),
    });
  }
}
