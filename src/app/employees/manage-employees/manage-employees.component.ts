// src/app/employees/manage-employees.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { finalize }          from 'rxjs/operators';

import { AuthService }   from '../../auth/auth.service';
import { UserService }   from '../../shared/services/user.service';
import { User }          from '../../shared/models/user.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manage-employees.component.html',
  styleUrls: ['./manage-employees.component.scss']
})
export class ManageEmployeesComponent implements OnInit {
  employees:     User[]       = [];
  editingUserId?: string;
  editedSalary   = 0;
  editedJobTitle = '';

  loading = false;
  error   = '';

  isManager = false;
  isAdmin   = false;
  deptId    = '';

  constructor(
    private auth:    AuthService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    const token = this.auth.token!;
    const payload: any = JSON.parse(atob(token.split('.')[1]));
    const roleRaw = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string || payload.role;
    this.isAdmin   = roleRaw.toLowerCase() === 'admin';
    this.isManager = this.isAdmin || roleRaw.toLowerCase() === 'manager';

    if (!this.isManager) {
      return;
    }

    const me = payload.sub as string;
    this.userSvc.getById(me).subscribe(u => {
      this.deptId = u.departmentId;
      this.loadEmployees();
    });
  }

  loadEmployees() {
    this.loading = true;
    this.userSvc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: users => {
          this.employees = this.isAdmin
            ? users
            : users.filter(u => u.departmentId === this.deptId && u.role === 'employee');
        },
        error: err => this.error = err ?? 'Failed to load'
      });
  }

  startEdit(u: User) {
    this.editingUserId = u.id;
    this.editedSalary  = u.salary;
    this.editedJobTitle= u.jobTitle;
    this.error = '';
  }

  cancelEdit() {
    this.editingUserId = undefined;
    this.error = '';
  }

  saveEdit(u: User) {
    this.error = '';
    this.userSvc.updateJobTitle(u.id, this.editedJobTitle).subscribe({
      next: () => {
        this.userSvc.updateSalary(u.id, this.editedSalary).subscribe({
          next: () => {
            this.cancelEdit();
            this.loadEmployees();
          },
          error: err => this.error = err ?? 'Salary update failed'
        });
      },
      error: err => this.error = err ?? 'Job title update failed'
    });
  }
}
