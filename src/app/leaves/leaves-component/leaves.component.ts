import { Component, OnInit }          from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { RouterModule }               from '@angular/router';
import { forkJoin }                   from 'rxjs';

import { AuthService }                from '../../auth/auth.service';
import { UserService }                from '../../shared/services/user.service';
import { LeaveRequestService }        from '../../shared/services/leave-request.service';
import { LeaveRequest, LeaveType }    from '../../shared/models/leave-request.model';
import { User }                       from '../../shared/models/user.model';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './leaves.component.html',
  styleUrls: ['./leaves.component.scss']
})
export class LeavesComponent implements OnInit {
  // role & user
  isManager = false;
  userId    = '';

  // form fields
  leaveTypes    = ['annual', 'compassionate', 'parental', 'paid', 'unpaid', 'sick', 'toil', 'academic', 'misc'] as LeaveType[];
  newType       !: LeaveType;
  newStartDate  = '';
  newEndDate    = '';
  newReason     = '';

  // data
  myRequests       : LeaveRequest[] = [];
  pendingRequests  : LeaveRequest[] = [];
  historyRequests  : LeaveRequest[] = [];

  // to map userId → username
  userMap: Record<string,string> = {};

  // errors
  formError   = '';
  actionError = '';

  todayString = '';  // YYYY-MM-DD
  maxString   = '';  // YYYY-MM-DD one year out

  constructor(
    private auth:     AuthService,
    private userSvc:  UserService,
    private leaveSvc: LeaveRequestService
  ) {}

  ngOnInit() {
    const d = new Date();
    this.todayString = this.toIsoDate(d);
    const oneYear = new Date(d);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    this.maxString = this.toIsoDate(oneYear);

    const token   = this.auth.token!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.userId    = payload.sub as string;
    const roles    = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    this.isManager = roles.includes('admin') || roles.includes('manager');
    this.newType   = this.leaveTypes[0];

    if (this.isManager) {
      this.loadManagerLists();
    } else {
      this.loadMyRequests();
    }
  }

  private loadManagerLists() {
    forkJoin({
      pending:   this.leaveSvc.listPending(),
      approved:  this.leaveSvc.listByStatus('approved'),
      rejected:  this.leaveSvc.listByStatus('rejected'),
      completed: this.leaveSvc.listByStatus('completed')
    }).subscribe(({ pending, approved, rejected, completed }) => {
      this.pendingRequests = pending;
      this.historyRequests = [...approved, ...rejected, ...completed];
      this.loadUserMap([...this.pendingRequests, ...this.historyRequests]);
    });
  }

  private loadMyRequests() {
    this.leaveSvc.listByUser(this.userId)
      .subscribe(list => this.myRequests = list);
  }

  submitRequest() {
    this.formError = '';
    if (!this.newStartDate || !this.newEndDate || !this.newReason.trim()) {
      this.formError = 'All fields are required.';
      return;
    }
    const payload = {
      userId:    this.userId,
      type:      this.newType,
      startDate: this.newStartDate,
      endDate:   this.newEndDate,
      reason:    this.newReason.trim()
    };

    this.leaveSvc.create(payload).subscribe({
      next: () => {
        this.loadMyRequests();
        this.newReason = '';
      },
      error: (err: any) => this.formError = err ?? 'Failed to submit'
    });
  }

  approve(req: LeaveRequest) {
    this.actionError = '';
    this.leaveSvc.approve(req.id, this.userId).subscribe({
      next: () => this.loadManagerLists(),
      error: (err: any) => this.actionError = err ?? 'Approve failed.'
    });
  }

  reject(req: LeaveRequest) {
    this.actionError = '';
    this.leaveSvc.reject(req.id, this.userId).subscribe({
      next: () => this.loadManagerLists(),
      error: (err: any) => this.actionError = err ?? 'Reject failed.'
    });
  }

  private loadUserMap(requests: LeaveRequest[]) {
    const ids = Array.from(new Set(requests.map(r => r.userId)));
    if (!ids.length) return;
    const calls = ids.map(id => this.userSvc.getById(id));
    forkJoin(calls).subscribe((users: User[]) => {
      users.forEach(u => this.userMap[u.id] = u.username);
    });
  }

  countBusinessDays(startStr: string, endStr: string): number {
    const start = new Date(startStr);
    const end   = new Date(endStr);
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (![0,6].includes(d.getDay())) days++;
    }
    return days;
  }

  private toIsoDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth()+1).padStart(2,'0');
    const dd   = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
