// src/app/manage-leaves/manage-leaves.component.ts

import { Component, OnInit }    from '@angular/core';
import { finalize }             from 'rxjs/operators';
import { LeaveRequestService }  from '../../shared/services/leave-request.service';
import { LeaveRequest }         from '../../shared/models/leave-request.model';
import { AuthService }          from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel/filter-panel.component';
import { FilterConfig } from '../../shared/models/filter-config';

@Component({
  selector: 'app-manage-leaves',
  imports: [CommonModule, RouterModule, FormsModule, FilterPanelComponent],
  templateUrl: './manage-leaves.component.html',
  styleUrls: ['./manage-leaves.component.scss']
})
export class ManageLeavesComponent implements OnInit {
  list: LeaveRequest[] = [];
  filtered: LeaveRequest[] = [];
  loading = false;

  editId?: string;
  deleteId?: string;
  error   = '';

  private adminId!: string;

  userMap: Record<string,string> = {};
  editMap: Record<string, Partial<LeaveRequest>> = {};

  leaveFilterConfig: FilterConfig[] = [
    { name: 'username', label: 'Filter by Username', type: 'text' },
    { name: 'month', label: 'Filter by Month', type: 'month'},
    { name: 'type', label: 'Filter by Type', type: 'select', options: [] },
    { name: 'status', label: 'Filter by Status', type: 'select', options: [] }
  ];

  private activeFilters: Record<string, any> = {};

  constructor(
    private svc: LeaveRequestService,
    private auth: AuthService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    const payload = JSON.parse(atob(this.auth.token!.split('.')[1]));
    this.adminId = payload.sub as string;
    this.userSvc.getAll().subscribe(users => {
      this.userMap = {};
      users.forEach(u => this.userMap[u.id] = u.username);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.svc.listAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: all => {
          this.list = all;
          const uniqueLeaveTypes = new Set(all.map(l => l.type));
          const uniqueLeaveStatuses = new Set(all.map(l => l.status));
          
          const leaveTypeOptions = Array.from(uniqueLeaveTypes).map(type => ({
            value: type,
            label: type
          }));

          const leaveStatusOptions = Array.from(uniqueLeaveStatuses).map(status => ({
            value: status,
            label: status
          }));

          const leaveTypeConfig = this.leaveFilterConfig.find(c => c.name === 'type');
          const leaveStatusConfig = this.leaveFilterConfig.find(c => c.name === 'status');
          if (leaveTypeConfig) {
            leaveTypeConfig.options = leaveTypeOptions;
          }
          if (leaveStatusConfig) {
            leaveStatusConfig.options = leaveStatusOptions;
          }

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
    const monthFilter = this.activeFilters['month'] || '';
    const leaveTypeFilter = this.activeFilters['type'] || '';
    const leaveStatusFilter = this.activeFilters['status'] || '';

    this.filtered = this.list.filter(s => {
      const username = (this.userMap[s.userId] || '').toLowerCase();

      const matchesName = usernameFilter ? username.includes(usernameFilter) : true;
      const matchesMonth = monthFilter ? s.startDate.startsWith(monthFilter) : true;
      const matchesLeaveType = leaveTypeFilter ? s.type === leaveTypeFilter : true;
      const matchesLeaveStatus = leaveStatusFilter ? s.status === leaveStatusFilter : true;

      return matchesName && matchesMonth && matchesLeaveType && matchesLeaveStatus
    })
  }

  approve(r: LeaveRequest) {
    this.loading = true;
    this.svc.approve(r.id, this.adminId)
      .pipe(finalize(() => this.load()))
      .subscribe({
        error: e => this.error = e.error ?? 'Approve failed'
      });
  }

  reject(r: LeaveRequest) {
    this.loading = true;
    this.svc.reject(r.id, this.adminId)
      .pipe(finalize(() => this.load()))
      .subscribe({
        error: e => this.error = e.error ?? 'Reject failed'
      });
  }

  startEdit(l: LeaveRequest) {
    this.editId = l.id;
    this.editMap[l.id] = {
      type: l.type,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason
    };
  }

  saveEdit(l: LeaveRequest) {
    const buf = this.editMap[l.id];
    this.svc.update(l.id, {
      type: l.type,
      startDate: buf.startDate,
      endDate: buf.endDate,
      reason: buf.reason,
    }).subscribe(() => {
      if (buf.type !== undefined) l.type = buf.type;
      if (buf.startDate !== undefined) l.startDate = buf.startDate;
      if (buf.endDate !== undefined) l.endDate = buf.endDate;
      if (buf.reason !== undefined) l.reason = buf.reason;
      this.editId = undefined;
      delete this.editMap[l.id];
    });
  }

  cancelEdit() {
    delete this.editMap[this.editId!];
    this.editId = undefined;
    this.error = '';
  }

  startDelete(l: LeaveRequest) {
    this.deleteId = l.id;
  }

  confirmDelete(l: LeaveRequest) {
    this.loading = true;
    this.svc.delete(l.id).pipe(finalize(() => {
      this.loading = false;
      this.deleteId = undefined;
    })).subscribe({
      next: () => this.load(),
      error: err => this.error = err ?? 'Delete failed'
    });
  }

  cancelDelete() {
    this.deleteId = undefined;
    this.error = '';
  }
}
