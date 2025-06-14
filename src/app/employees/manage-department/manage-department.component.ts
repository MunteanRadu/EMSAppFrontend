import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import { finalize }             from 'rxjs/operators';

import { AuthService }          from '../../auth/auth.service';
import { UserService }          from '../../shared/services/user.service';
import { User }                 from '../../shared/models/user.model';
import { DepartmentService } from '../../shared/services/department.service';

@Component({
  selector: 'app-manage-department',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-department.component.html',
  styleUrls: ['./manage-department.component.scss']
})
export class ManageDepartmentsComponent implements OnInit {
  deptId?: string;
  assigned: User[] = [];
  unassigned: User[] = [];

  editId?: string;
  deleteId?: string;
  assigningAction: 'assign' | 'remove' = 'assign';

  loading = false;
  error   = '';

  constructor(
    private auth:    AuthService,
    private userSvc: UserService,
    private deptSvc: DepartmentService
  ) {}

  ngOnInit() {
    const payload: any = JSON.parse(atob(this.auth.token!.split('.')[1]));
    const me = payload.sub as string;
    this.userSvc.getById(me).subscribe(u => {
      this.deptId = u.departmentId ?? '';
      this.loadList();
    });
  }

  private loadList() {
    if (!this.deptId) return;
    this.loading = true;
    this.error = '';
    this.userSvc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: users => {
          this.assigned = users.filter(u => u.role === 'employee' && u.departmentId === this.deptId);
          this.unassigned = users.filter(u => u.role === 'employee' && (u.departmentId === "" || u.departmentId === null));
        },
        error: err => this.error = err ?? 'Load failed'
      });
  }

  startAssign(u: User) {
    this.editId = u.id;
    this.assigningAction = 'assign';
  }

  startRemove(u: User) {
    this.deleteId = u.id;
    this.assigningAction = 'remove';
  }

  confirmAssign(u: User) {
    this.loading = true;
    const targetDeptId = this.deptId;

    this.deptSvc.addEmployee(u.id, targetDeptId!)
      .pipe(finalize(() => {
        this.loading = false;
        this.editId = undefined;
      }))
      .subscribe({
        next: () => this.loadList(),
        error: err => this.error = err ?? 'Assignment failed'
      });
  }

  confirmRemove(u: User) {
    this.loading = true;
    const targetDeptId = this.deptId;

    this.deptSvc.removeEmployee(u.id, targetDeptId!)
      .pipe(finalize(() => {
        this.loading = false;
        this.deleteId = undefined;
      }))
      .subscribe({
        next: () => this.loadList(),
        error: err => this.error = err ?? 'Remove failed'
      });
  }

  cancel() {
    this.deleteId = undefined;
    this.editId = undefined;
  }
}
