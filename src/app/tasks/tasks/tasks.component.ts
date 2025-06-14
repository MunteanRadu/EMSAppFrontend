// src/app/tasks/tasks.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../shared/services/user.service';
import { AssignmentService } from '../../shared/services/assignment.service';
import { Assignment } from '../../shared/models/assignment.model';
import { User } from '../../shared/models/user.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { TaskDetailsDialogComponent } from '../assignment-details-dialog/assignment-details-dialog.component';

interface Group {
  key: 'Pending' | 'InProgress' | 'Done' | 'Approved' | 'Rejected';
  label: string;
  items: Assignment[];
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatTabsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  // employee arrays
  deptPending: Assignment[] = [];
  myOngoing: Assignment[] = [];
  myRejected: Assignment[] = [];
  myCompleted: Assignment[] = [];

  // manager arrays
  managerPending: Assignment[] = [];
  managerInProgress: Assignment[] = [];
  managerDone: Assignment[] = [];
  managerApproved: Assignment[] = [];
  managerRejectedForReview: Assignment[] = [];

  // tab groups
  managerGroups: Group[] = [];
  // (for employee we’ll inline in template)

  loading = false;
  private userId!: string;
  isManager = false;
  departmentId!: string;

  // create form
  newTitle = '';
  newDescription = '';
  newDueDate = '';
  todayString = '';

  userMap: Record<string, string> = {};
  todayIso = new Date().toISOString().slice(0, 10);

  constructor(
    private auth: AuthService,
    private userSvc: UserService,
    private taskSvc: AssignmentService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    // decode token
    const token = this.auth.token!;
    const payload: any = JSON.parse(atob(token.split('.')[1]));
    this.userId = payload.sub;
    const roleRaw = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string
                    || payload.role;
    this.isManager = ['manager', 'admin'].includes(roleRaw.toLowerCase());

    // date‐input min
    const d = new Date(); d.setHours(0,0,0,0);
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    this.todayString = `${d.getFullYear()}-${mm}-${dd}`;

    this.userSvc.getById(this.userId).subscribe(u => {
      this.departmentId = u.departmentId;
      this.loadTasks();
    });
  }

  private loadTasks() {
    this.loading = true;
    this.userMap = {};

    if (this.isManager) {
      this.taskSvc.listAll()
        .pipe(finalize(() => this.loading = false))
        .subscribe(list => {
          const deptTasks = list.filter(t => t.departmentId === this.departmentId);
          this.splitManagerTasks(deptTasks);
          this.buildManagerGroups();
          this.loadUserMap(deptTasks);
        });
    } else {
      forkJoin({
        dept: this.taskSvc.listAll(),
        me: this.taskSvc.listByAssignee(this.userId)
      })
        .pipe(finalize(() => this.loading = false))
        .subscribe(({ dept, me }) => {
          this.deptPending = dept.filter(t =>
            t.departmentId === this.departmentId && t.status === 'Pending'
          );
          this.myOngoing = me.filter(t => t.status === 'InProgress');
          this.myRejected = me.filter(t => t.status === 'Rejected');
          this.myCompleted = me.filter(t =>
            t.status === 'Done' || t.status === 'Approved'
          );
          this.loadUserMap([
            ...this.deptPending,
            ...this.myOngoing,
            ...this.myRejected,
            ...this.myCompleted
          ]);
        });
    }
  }

  private splitManagerTasks(tasks: Assignment[]) {
    this.managerPending = tasks.filter(t => t.status === 'Pending');
    this.managerInProgress = tasks.filter(t => t.status === 'InProgress');
    this.managerDone = tasks.filter(t => t.status === 'Done');
    this.managerApproved = tasks.filter(t => t.status === 'Approved');
    this.managerRejectedForReview = tasks.filter(t => t.status === 'Rejected');
  }

  private buildManagerGroups() {
    this.managerGroups = [
      { key: 'Pending', label: 'Pending', items: this.managerPending },
      { key: 'InProgress', label: 'In Progress', items: this.managerInProgress },
      { key: 'Done', label: 'Done (Awaiting Approval)', items: this.managerDone },
      { key: 'Approved', label: 'Approved', items: this.managerApproved },
      { key: 'Rejected', label: 'Rejected', items: this.managerRejectedForReview }
    ];
  }

  create() {
    if (!this.newTitle || !this.newDueDate) return;
    this.taskSvc.create({
      title: this.newTitle,
      description: this.newDescription,
      dueDate: this.newDueDate,
      departmentId: this.departmentId,
      managerId: this.userId
    }).subscribe(() => {
      this.newTitle = '';
      this.newDescription = '';
      this.newDueDate = '';
      this.loadTasks();
    });
  }

  start(t: Assignment)     { this.taskSvc.start(t.id, this.userId).subscribe(() => this.loadTasks()); }
  complete(t: Assignment)  { this.taskSvc.complete(t.id).subscribe(() => this.loadTasks()); }
  approve(t: Assignment)   { this.taskSvc.approve(t.id).subscribe(() => this.loadTasks()); }
  reject(t: Assignment)    { this.taskSvc.reject(t.id).subscribe(() => this.loadTasks()); }

  private loadUserMap(tasks: Assignment[]) {
    const ids = Array.from(new Set(tasks.map(t => t.assignedToId).filter(id => !!id)));
    if (!ids.length) return;
    forkJoin(ids.map(id => this.userSvc.getById(id!)))
      .subscribe((users: User[]) => users.forEach(u => this.userMap[u.id] = u.username));
  }

  viewTask(t: Assignment) {
    this.dialog.open(TaskDetailsDialogComponent, {
      data: t,
      width: '600px',
      maxHeight: '90vh',
      autoFocus: false
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'InProgress': return 'in-progress';
      case 'Done':       return 'done';
      case 'Approved':   return 'approved';
      case 'Rejected':   return 'rejected';
      default:           return '';
    }
  }

  isOverdue(t: Assignment): boolean {
    return t.status === 'InProgress' && t.dueDate < this.todayIso;
  }
}
