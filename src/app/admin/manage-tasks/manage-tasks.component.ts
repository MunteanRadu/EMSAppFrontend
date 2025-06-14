import { Component, OnInit } from '@angular/core';
import { finalize }          from 'rxjs/operators';
import { AssignmentService } from '../../shared/services/assignment.service';
import { Assignment }        from '../../shared/models/assignment.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { FormsModule } from '@angular/forms';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel/filter-panel.component';
import { FilterConfig } from '../../shared/models/filter-config';

@Component({
  selector: 'app-manage-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterPanelComponent],
  templateUrl: './manage-tasks.component.html',
  styleUrls: ['./manage-tasks.component.scss']
})
export class ManageTasksComponent implements OnInit {
  list: Assignment[] = [];
  filtered: Assignment[] = [];
  loading = false;
  error = '';

  deleteId?: string;
  editId?: string;

  userMap: Record<string, string> = {};
  editMap: Record<string, Partial<Assignment>> = {};

  todayIso = new Date().toISOString().slice(0, 10);

  assignmentFilterConfig: FilterConfig[] = [
    { name: 'assignee', label: 'Filter by Assignee', type: 'text' },
    { name: 'status', label: 'Filter by Status', type: 'select', options: [] },
    {
      name: 'overdue', label: 'Filter by Overdue', type: 'select',
      options: [
        { value: 'yes', label: 'Overdue Only' },
        { value: 'no', label: 'Not Overdue' }
      ]
    }
  ];

  private activeFilters: Record<string, any> = {};

  constructor(
    private svc: AssignmentService,
    private userSvc: UserService
  ) { }

  ngOnInit() {
    this.userSvc.getAll().subscribe(users => {
      this.userMap = {};
      users.forEach(u => this.userMap[u.id] = u.username);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.svc.listAll().pipe(finalize(() => this.loading = false))
      .subscribe({
        next: x => {
          this.list = x;
          
          // Dynamically populate status filter options
          const statuses = new Set(x.map(t => t.status));
          const statusOptions = Array.from(statuses).map(s => ({ value: s, label: s }));
          const statusConfig = this.assignmentFilterConfig.find(c => c.name === 'status');
          if (statusConfig) {
            statusConfig.options = statusOptions;
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
    const assigneeFilter = (this.activeFilters['assignee'] || '').toLowerCase();
    const statusFilter = this.activeFilters['status'] || '';
    const overdueFilter = this.activeFilters['overdue'] || '';

    this.filtered = this.list.filter(t => {
      const assigneeName = this.getUserName(t.assignedToId).toLowerCase();

      const matchesAssignee = assigneeFilter ? assigneeName.includes(assigneeFilter) : true;
      const matchesStatus = statusFilter ? t.status === statusFilter : true;

      let matchesOverdue = true;
      if (overdueFilter === 'yes') {
        matchesOverdue = this.isOverdue(t);
      } else if (overdueFilter === 'no') {
        matchesOverdue = !this.isOverdue(t);
      }

      return matchesAssignee && matchesStatus && matchesOverdue;
    });
  }

  start(t: Assignment) {
    this.svc.start(t.id, t.assignedToId!).subscribe(() => this.load());
  }

  complete(t: Assignment) {
    this.svc.complete(t.id).subscribe(() => this.load());
  }

  approve(t: Assignment) {
    this.svc.approve(t.id).subscribe(() => this.load());
  }

  reject(t: Assignment) {
    this.svc.reject(t.id).subscribe(() => this.load());
  }

  startEdit(t: Assignment) {
    this.editId = t.id;
    this.editMap[t.id] = {
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
    };
  }

  saveEdit(t: Assignment) {
    const buf = this.editMap[t.id];
    this.svc.update(t.id, {
      title: buf.title,
      description: buf.description,
      dueDate: this.fixDateTimeFormat(buf.dueDate),
    }).subscribe(() => {
      if (buf.title !== undefined) t.title = buf.title;
      if (buf.description !== undefined) t.description = buf.description;
      if (buf.dueDate !== undefined) t.dueDate = buf.dueDate;
      this.editId = undefined;
      delete this.editMap[t.id];
    });
  }

  cancelEdit() {
    delete this.editMap[this.editId!];
    this.editId = undefined;
    this.error = '';
  }

  startDelete(t: Assignment) {
    this.deleteId = t.id;
  }

  confirmDelete(t: Assignment) {
    this.loading = true;
    this.svc.delete(t.id).pipe(finalize(() => {
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

  private fixDateTimeFormat(dt: string | undefined): string {
    if (!dt) return new Date().toISOString();
    return dt.length === 16 ? dt + ':00' : dt;
  }

  isOverdue(t: Assignment): boolean {
    return (t.status === 'Pending' || t.status === 'InProgress') && t.dueDate < this.todayIso;
  }

  getUserName(userId: string | undefined): string {
    if (!userId) return '-';
    return this.userMap[userId] || 'Unknown User';
  }
}
