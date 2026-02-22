import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Employee } from '../../../core/models/item.models';
import { ALL_PERMISSIONS, PermissionKey } from '../../../core/models/auth.models';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Employees</h1>
        <button (click)="openForm()" class="btn-primary">+ Add Employee</button>
      </div>

      @if (showForm()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-semibold">{{ editId() ? 'Edit' : 'New' }} Employee</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Full Name <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.fullName" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Email <span class="text-red-500">*</span></label>
              <input [(ngModel)]="form.email" type="email" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Phone</label>
              <input [(ngModel)]="form.phone" class="input-field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Role</label>
              <select [(ngModel)]="form.role" class="input-field">
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Salary</label>
              <input [(ngModel)]="form.salary" type="number" min="0" class="input-field" />
            </div>
            @if (!editId()) {
              <div>
                <label class="block text-sm font-medium mb-1">Password <span class="text-red-500">*</span></label>
                <input [(ngModel)]="form.password" type="password" class="input-field" />
              </div>
            }
          </div>

          <!-- Permissions -->
          <div>
            <h3 class="text-sm font-medium mb-2">Permissions</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              @for (perm of allPermissions; track perm) {
                <label class="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" [checked]="form.permissions.includes(perm)"
                    (change)="togglePermission(perm)" class="w-4 h-4 rounded" />
                  <span>{{ formatPermission(perm) }}</span>
                </label>
              }
            </div>
          </div>

          <div class="flex gap-2">
            <button (click)="saveEmployee()" class="btn-primary" [disabled]="saving()">Save</button>
            <button (click)="showForm.set(false)" class="btn-outline">Cancel</button>
          </div>
        </div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Name</th>
              <th class="px-4 py-3 text-left font-medium">Email</th>
              <th class="px-4 py-3 text-left font-medium">Role</th>
              <th class="px-4 py-3 text-right font-medium">Salary</th>
              <th class="px-4 py-3 text-center font-medium">Permissions</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            @for (emp of employees(); track emp.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">{{ emp.fullName }}</td>
                <td class="px-4 py-3 text-gray-500">{{ emp.email }}</td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class]="emp.role === 'Owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                    {{ emp.role }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">{{ emp.salary | currency }}</td>
                <td class="px-4 py-3 text-center text-xs text-gray-500">
                  {{ emp.permissions?.length || 0 }} perms
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  @if (emp.role !== 'Owner') {
                    <button (click)="editEmployee(emp)" class="text-blue-600 hover:underline">Edit</button>
                    <button (click)="deleteEmployee(emp)" class="text-red-600 hover:underline">Delete</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">No employees</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class EmployeesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toastService = inject(ToastService);

  readonly employees = signal<Employee[]>([]);
  readonly showForm = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly allPermissions = ALL_PERMISSIONS;

  form: {
    fullName: string; email: string; phone: string; role: string;
    salary: number; password: string; permissions: PermissionKey[];
  } = {
    fullName: '', email: '', phone: '', role: 'Employee',
    salary: 0, password: '', permissions: [],
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<Employee[]>('/Employees').subscribe(d => this.employees.set(d || []));
  }

  openForm(): void {
    this.form = { fullName: '', email: '', phone: '', role: 'Employee', salary: 0, password: '', permissions: [] };
    this.editId.set(null);
    this.showForm.set(true);
  }

  editEmployee(emp: Employee): void {
    this.form = {
      fullName: emp.fullName, email: emp.email, phone: emp.phone || '',
      role: emp.role, salary: emp.salary || 0, password: '',
      permissions: [...(emp.permissions || [])] as PermissionKey[],
    };
    this.editId.set(emp.id);
    this.showForm.set(true);
  }

  deleteEmployee(emp: Employee): void {
    if (!confirm(`Delete "${emp.fullName}"?`)) return;
    this.api.delete(`/Employees/${emp.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed'),
    });
  }

  togglePermission(perm: PermissionKey): void {
    const idx = this.form.permissions.indexOf(perm);
    if (idx >= 0) this.form.permissions.splice(idx, 1);
    else this.form.permissions.push(perm);
  }

  formatPermission(perm: string): string {
    return perm.replace(':', ' ').replace(/([A-Z])/g, ' $1').trim();
  }

  saveEmployee(): void {
    if (!this.form.fullName || !this.form.email) {
      this.toastService.error('Name and email required');
      return;
    }
    if (!this.editId() && !this.form.password) {
      this.toastService.error('Password required for new employee');
      return;
    }
    this.saving.set(true);
    const body: any = { ...this.form };
    if (this.editId()) delete body.password;

    const req$ = this.editId()
      ? this.api.put(`/Employees/${this.editId()}`, body)
      : this.api.post('/Employees', body);
    req$.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.toastService.success('Saved'); this.load(); },
      error: (err) => { this.saving.set(false); this.toastService.error(err.message || 'Failed'); },
    });
  }
}
