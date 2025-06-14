import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PunchRecordService } from '../../shared/services/punch-record.service';
import { PunchRecord } from '../../shared/models/punch-record.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { FormsModule } from '@angular/forms';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel/filter-panel.component';
import { FilterConfig } from '../../shared/models/filter-config';

@Component({
  selector: 'app-manage-punches',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FilterPanelComponent],
  templateUrl: './manage-punches.component.html',
  styleUrls: ['./manage-punches.component.scss']
})
export class ManagePunchesComponent implements OnInit {
  list: PunchRecord[] = [];
  filtered: PunchRecord[] = [];
  loading = false;
  error = '';

  userMap: Record<string, string> = {};
  editMap: Record<string, Partial<PunchRecord>> = {};
  editId?: string;
  deleteId?: string;

  punchFilterConfig: FilterConfig[] = [
    { name: 'username', label: 'Filter by Username', type: 'text' },
    { name: 'date', label: 'Filter by Date', type: 'date' }
  ];

  private activeFilters: Record<string, any> = {};

  constructor(
    private svc: PunchRecordService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    this.userSvc.getAll().subscribe(users => {
      this.userMap = {};
      users.forEach(u => this.userMap[u.id] = u.username);
      this.load();
    });
  }

  private load() {
    this.loading = true;
    this.svc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: recs => {
          this.list = recs;
          this.applyFilter();
        },
        error: err => this.error = err ?? 'Load failed'
      });
  }

  onFilterChange(filters: Record<string, any>) {
    this.activeFilters = filters;
    this.applyFilter();
  }

  private applyFilter() {
    const usernameFilter = (this.activeFilters['username'] || '').toLowerCase();
    const dateFilter = this.activeFilters['date'] || '';

    this.filtered = this.list.filter(p => {
      const uname = (this.userMap[p.userId] || '').toLowerCase();

      const matchesName = usernameFilter ? uname.includes(usernameFilter) : true;
      const matchesDate = dateFilter ? p.date === dateFilter : true;
      
      return matchesName && matchesDate;
    });
  }

  startEdit(p: PunchRecord) {
    this.editId = p.id;
    this.editMap[p.id] = {
      date: p.date,
      timeIn: p.timeIn,
      timeOut: p.timeOut,
    };
  }

  saveEdit(p: PunchRecord) {
    const buf = this.editMap[p.id]!;
    this.svc.update(p.id, {
      date: buf.date!,
      timeIn: buf.timeIn!,
      timeOut: buf.timeOut!
    }).subscribe({
      next: () => {
        if (buf.date !== undefined) p.date = buf.date;
        if (buf.timeIn !== undefined) p.timeIn = buf.timeIn;
        if (buf.timeOut !== undefined) p.timeOut = buf.timeOut;
        this.cancelEdit();
      },
      error: err => {
        this.error = err.error ?? 'Update failed';
      }
    });
  }

  cancelEdit() {
    if (this.editId) {
      delete this.editMap[this.editId];
      this.editId = undefined;
      this.error = '';
    }
  }

  startDelete(p: PunchRecord) {
    this.deleteId = p.id;
  }

  confirmDelete(p: PunchRecord) {
    this.loading = true;
    this.svc.delete(p.id)
      .pipe(finalize(() => {
        this.loading = false;
        this.deleteId = undefined;
      }))
      .subscribe({
        next: () => this.load(),
        error: err => this.error = err ?? 'Delete failed'
      });
  }

  cancelDelete() {
    this.deleteId = undefined;
    this.error = '';
  }
}