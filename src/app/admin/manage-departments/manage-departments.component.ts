import { Component, OnInit } from '@angular/core';
import { finalize }          from 'rxjs/operators';
import { DepartmentService } from '../../shared/services/department.service';
import { Department }        from '../../shared/models/department.model';
import { UserService }       from '../../shared/services/user.service';
import { User }              from '../../shared/models/user.model';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { FormsModule }       from '@angular/forms';

@Component({
  selector: 'app-manage-departments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-departments.component.html',
  styleUrls: ['./manage-departments.component.scss']
})
export class ManageDepartmentsComponent implements OnInit {
  list: Department[] = [];
  loading = false;
  error   = '';

  newName   = '';
  editId?:  string;
  editName  = '';
  deleteId?: string;
  editMap: Record<string, Partial<Department>> = {};

  selectedDeptId: string | null = null;
  assigned:   User[] = [];
  unassigned: User[] = [];

  selectedDeptManager: User | null = null;

  constructor(
    private svc: DepartmentService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    this.loadDepartments();
  }

  private loadDepartments() {
    this.loading = true;
    this.svc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: depts => {
          this.list = depts;
          if (!this.selectedDeptId && depts.length) {
            this.selectDept(depts[0].id);
          }
          this.error = '';
        },
        error: err => this.error = err ?? 'Failed to load departments'
      });
  }

  get selectedDeptName(): string {
    const dept = this.list.find(d => d.id === this.selectedDeptId);
    return dept?.name ?? '';
  }

  create() {
    const name = this.newName.trim();
    if (!name) return;
    this.svc.create(name)
      .subscribe(() => {
        this.newName = '';
        this.loadDepartments();
        this.error = '';
      }, e => this.error = e.error ?? 'Create failed');
  }

  startEdit(d: Department) {
    this.editId = d.id;
    this.editMap[d.id] = { name: d.name };
  }

  saveEdit(d: Department) {
    const buf = this.editMap[d.id]?.name?.trim();
    if (!buf) return;
    this.svc.update(d.id, { name: buf })
      .subscribe(() => {
        d.name = buf;
        this.editId = undefined;
        delete this.editMap[d.id];
        this.error = '';
      }, e => this.error = e.error ?? 'Update failed');
  }

  cancelEdit() {
    if (this.editId) {
      delete this.editMap[this.editId];
      this.editId = undefined;
      this.error = '';
    }
  }

  startDelete(d: Department) {
    this.deleteId = d.id;
  }

  confirmDelete(d: Department) {
    this.svc.delete(d.id)
      .subscribe(() => {
        this.deleteId = undefined;
        if (this.selectedDeptId === d.id) {
          this.selectedDeptId = null;
          this.assigned = [];
          this.unassigned = [];
        }
        this.loadDepartments();
        this.error = '';
      }, e => this.error = e.error ?? 'Delete failed');
  }

  cancelDelete() {
    this.deleteId = undefined;
    this.error = '';
  }


  selectDept(deptId: string) {
    this.selectedDeptId = deptId;
    this.loadUsersForDept(deptId);
  }

  private loadUsersForDept(deptId: string) {
    this.loading = true;
    this.userSvc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: users => {
          const currentDept = this.list.find(d => d.id === deptId);

          if (currentDept && currentDept.managerId) {
            this.selectedDeptManager = users.find(u => u.id === currentDept.managerId) || null;
          } else {
            this.selectedDeptManager = null;
          }
          this.assigned   = users.filter(u => u.role === 'employee' && u.departmentId === deptId);
          this.unassigned = users.filter(u => u.role !== 'admin' && (u.departmentId === "" || u.departmentId === null));
          this.error = '';
        },
        error: err => this.error = err ?? 'Failed to load users'
      });
  }

  assign(u: User) {
    if (!this.selectedDeptId) return;
    this.userSvc.updateDepartment(u.id, this.selectedDeptId)
      .subscribe(() => {
        this.loadUsersForDept(this.selectedDeptId!),
        this.error = '';
      },
      e => this.error = e.error ?? 'Assign failed');
  }

  remove(u: User) {
    this.userSvc.updateDepartment(u.id, null)
      .subscribe(() => {
        if (this.selectedDeptId)
          this.loadUsersForDept(this.selectedDeptId);
      }, e => this.error = e.error ?? 'Remove failed');
  }
}
