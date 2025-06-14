// src/app/admin/manage-managers.component.ts
import { Component, OnInit } from '@angular/core';
import { finalize }          from 'rxjs/operators';
import { AuthService }       from '../../auth/auth.service';
import { UserService }       from '../../shared/services/user.service';
import { User }              from '../../shared/models/user.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DepartmentService } from '../../shared/services/department.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-managers',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-managers.component.html',
  styleUrls: ['./manage-managers.component.scss']
})
export class ManageManagersComponent implements OnInit {
  allManagers: User[] = [];
  deptId        = '';
  loading = false;
  error   = '';

  editId?: string;
  editedDeptId = '';
  deleteId?: string;

  objectKeys = Object.keys;


  departmentMap: Record<string, string> = {};

  constructor(
    private auth:    AuthService,
    private userSvc: UserService,
    private departmentSvc: DepartmentService
  ) {}

  ngOnInit() {
    const payload: any = JSON.parse(atob(this.auth.token!.split('.')[1]));
    const me = payload.sub as string;
    this.userSvc.getById(me).subscribe(u => {
    this.deptId = u.departmentId!;
    
    // Load departments first
    this.departmentSvc.getAll().subscribe(depts => {
      this.departmentMap = {};
      depts.forEach(d => this.departmentMap[d.id] = d.name);

      // Then load managers
      this.loadLists();
    });
  });
  }

  private loadLists() {
    this.loading = true;
    this.userSvc.listManagers().pipe(finalize(()=>this.loading=false))
      .subscribe({
        next: all => {
          this.allManagers = all.filter(u => u.role === 'manager');
        },
        error: err => this.error = err ?? 'Load failed'
      });
  }

  assign(u:User) {
    this.loading=true;
    this.userSvc.updateDepartment(u.id,this.deptId).pipe(finalize(()=>this.loading=false))
      .subscribe({ next:()=>this.loadLists(), error:e=>this.error=e.error });
  }
  remove(u:User) {
    this.loading=true;
    this.userSvc.updateDepartment(u.id,null).pipe(finalize(()=>this.loading=false))
      .subscribe({ next:()=>this.loadLists(), error:e=>this.error=e.error });
  }

  startEdit(u: User) {
    this.editId = u.id;
    this.editedDeptId = u.departmentId ?? '';
    this.error = '';
  }

  cancelEdit() {
    this.editId = undefined;
    this.error = '';
  }

  saveEdit(u: User) {
    this.loading = true;
    this.userSvc.updateDepartment(u.id, this.editedDeptId || null)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.cancelEdit();
          this.loadLists();
        },
        error: e => this.error = e.error ?? 'Update failed'
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
      next: () => this.loadLists(),
      error: e => this.error = e.error ?? 'Delete failed'
    });
  }

  cancelDelete() {
    this.deleteId = undefined;
    this.error = '';
  }
}
