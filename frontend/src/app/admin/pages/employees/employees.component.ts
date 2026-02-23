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
              <input [(ngModel)]="form.name" class="input-field" />
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
              <label class="block text-sm font-medium mb-1">Salary (Monthly)</label>
              <input [(ngModel)]="form.salaryMonthly" type="number" min="0" class="input-field" />
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
                  <input type="checkbox" [checked]="isPermissionEnabled(perm)"
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
                <td class="px-4 py-3 font-medium">{{ emp.name }}</td>
                <td class="px-4 py-3 text-gray-500">{{ emp.email }}</td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-1 rounded-full"
                    [class]="emp.role === 'Owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                    {{ emp.role }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">{{ emp.salaryMonthly | currency }}</td>
                <td class="px-4 py-3 text-center text-xs text-gray-500">
                  {{ countEnabledPerms(emp) }} perms
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
    name: string; email: string; phone: string; role: string;
    salaryMonthly: number; password: string; enabledPermissions: Set<PermissionKey>;
  } = {
    name: '', email: '', phone: '', role: 'Employee',
    salaryMonthly: 0, password: '', enabledPermissions: new Set(),
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<Employee[]>('/Employees').subscribe(d => this.employees.set(d || []));
  }

  openForm(): void {
    this.form = { name: '', email: '', phone: '', role: 'Employee', salaryMonthly: 0, password: '', enabledPermissions: new Set() };
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
      enabledPermissions: enabled,
    };
    this.editId.set(emp.id);
    this.showForm.set(true);
  }

  deleteEmployee(emp: Employee): void {
    if (!confirm(`Delete "${emp.name}"?`)) return;
    this.api.delete(`/Employees/${emp.id}`).subscribe({
      next: () => { this.toastService.success('Deleted'); this.load(); },
      error: () => this.toastService.error('Failed'),
    });
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
      this.toastService.error('Name and email required');
      return;
    }
    if (!this.editId() && !this.form.password) {
      this.toastService.error('Password required for new employee');
      return;
    }
    this.saving.set(true);

    if (this.editId()) {
      // Update employee details
      const updateBody = {
        name: this.form.name, email: this.form.email, phone: this.form.phone,
        role: this.form.role, salaryMonthly: this.form.salaryMonthly, isActive: true,
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
            this.toastService.success('Saved'); this.load();
          }
        },
        error: (err) => { this.saving.set(false); this.toastService.error(err.message || 'Failed'); },
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
        this.toastService.success('Saved'); this.load();
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Employee saved but permissions failed');
        this.load();
      },
    });
  }
}
