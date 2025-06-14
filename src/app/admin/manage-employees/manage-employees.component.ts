import { Component, OnInit } from '@angular/core';
import { finalize }          from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UserService }       from '../../shared/services/user.service';
import { User }              from '../../shared/models/user.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../shared/services/department.service';
import { Department } from '../../shared/models/department.model';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel/filter-panel.component';
import { FilterConfig } from '../../shared/models/filter-config';

@Component({
  selector: 'app-manage-employees',
  imports: [CommonModule, RouterModule, FormsModule, FilterPanelComponent],
  templateUrl: './manage-employees.component.html',
  styleUrls: ['./manage-employees.component.scss']
})
export class ManageEmployeesComponent implements OnInit {
  list:     User[] = [];
  filtered: User[] = []
  editId?:    string;
  editedSalary  = 0;
  editedJob     = '';
  loading = false;
  error   = '';

  isAdmin   = false;
  isManager = false;
  deptId    = '';

  newUsername = '';
  newEmail    = '';
  newPassword = '';
  errorNew    = '';

  deleteId?: string;
  
  editedRole = '';

  departmentsMap = new Map<string, string>();

  employeeFilterConfig: FilterConfig[] = [
    { name: 'username', label: 'Filter by Username', type: 'text'},
    { name: 'email', label: 'Filter by Email', type: 'text'}
  ];

  private activeFilters: Record<string, any> = {};

  constructor(
    private auth:    AuthService,
    private userSvc: UserService,
    private deptSvc: DepartmentService 
  ) {}

  ngOnInit() {
    const payload: any = JSON.parse(atob(this.auth.token!.split('.')[1]));
    const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                || payload.role;
    const arr   = Array.isArray(roles)? roles : [roles];
    this.isAdmin   = arr.includes('admin');
    this.isManager = this.isAdmin || arr.includes('manager');

    // get own dept
    const me = payload.sub as string;
    this.userSvc.getById(me).subscribe(u => {
      this.deptId = u.departmentId!;
    });

    this.deptSvc.getAll().subscribe((depts: Department[]) => {
      depts.forEach(d => this.departmentsMap.set(d.id, d.name));
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.userSvc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: all => {
          this.list = this.isAdmin
            ? all
            : all.filter(u => u.departmentId === this.deptId);
            this.applyFilter();
        },
        error: err => this.error = err ?? 'Load failed'
      });
  }

  onFilterChange(filters: Record<string, any>) {
    this.activeFilters = filters;
    this.applyFilter();
  }

  applyFilter() {
    const usernameFilter = (this.activeFilters['username'] || '').toLowerCase();
    const emailFilter = (this.activeFilters['email'] || '').toLowerCase();

    this.filtered = this.list.filter(u => {
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();

      const matchesName = usernameFilter ? username.includes(usernameFilter) : true;
      const matchesEmail = emailFilter ? email.includes(emailFilter) : true;

      return matchesName && matchesEmail
    })
  }

  create() {
    this.errorNew = '';
    const uname = this.newUsername.trim();
    const email = this.newEmail.trim();
    const pass  = this.newPassword;

    if (!uname || !email || !pass) {
      this.errorNew = 'All fields required';
      return;
    }

    this.loading = true;
    this.userSvc.createEmployee({
      username: uname,
      email:    email,
      passwordHash: pass,
      departmentId: this.deptId
    }).pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.newUsername = '';
          this.newEmail    = '';
          this.newPassword = '';
          this.load();
        },
        error: err => this.errorNew = err ?? 'Create failed'
      });
  }


  startEdit(u: User) {
    this.editId   = u.id;
    this.editedSalary = u.salary;
    this.editedJob    = u.jobTitle;
    this.editedRole   = u.role.toLowerCase();
    this.error = '';
  }

  cancelEdit() {
    this.editId = undefined;
    this.error     = '';
  }

  saveEdit(u: User) {
    const job = this.editedJob.trim();
    if (!job) { this.error = 'Job title is required'; return; }

    this.loading = true;

    this.userSvc.update(u.id, {
      jobTitle: job,
      salary: this.editedSalary,
      role: this.editedRole
    }).pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.cancelEdit();
          this.load();
        },
        error: err => this.error = err ?? 'Update failed'
      });
  }


  startDelete(u: User) {
    this.deleteId = u.id;
  }

  confirmDelete(u: User) {
    this.loading = true;
    this.userSvc.delete(u.id).pipe(finalize(() => {
      this.loading = false;
      this.deleteId = undefined;
    })).subscribe({
      next: () => this.load(),
      error: err => this.error = err ?? 'Delete failed'
    });
  }

  cancelDelete() {
    this.deleteId = undefined;
  }

  getDepartmentName(deptId: string): string {
    return this.departmentsMap.get(deptId) ?? '-';
  }
}
