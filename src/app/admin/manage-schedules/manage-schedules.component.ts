// src/app/admin/manage-schedules.component.ts
import { Component, OnInit }        from '@angular/core';
import { CommonModule }              from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { finalize }                  from 'rxjs/operators';
import { ScheduleService }           from '../../shared/services/schedule.service';
import { ShiftAssignment } from '../../shared/models/shift-assignment'; 
import { UserService } from '../../shared/services/user.service';
import { FilterPanelComponent } from '../../shared/components/filter-panel/filter-panel/filter-panel.component';
import { FilterConfig } from '../../shared/models/filter-config';

@Component({
  selector: 'app-manage-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPanelComponent],
  templateUrl: './manage-schedules.component.html',
  styleUrls: ['./manage-schedules.component.scss']
})
export class ManageSchedulesComponent implements OnInit {
  list: ShiftAssignment[] = [];
  filtered:    ShiftAssignment[] = [];
  loading = false;
  error = '';

  editId?: string;
  editMap: Record<string, Partial<ShiftAssignment>> = {};

  deleteId?: string;

  userMap: Record<string, string> = {};

  shiftFilterConfig: FilterConfig[] = [
    { name: 'username', label: 'Filter by Username', type: 'text' },
    { name: 'date', label: 'Filter by Date', type: 'date' },
    { name: 'type', label: 'Filter by Type', type: 'select', options: [] }
  ];

  private activeFilters: Record<string, any> = {};

  constructor(
    private svc: ScheduleService,
    private userSvc: UserService,
  ) {}

  ngOnInit() {
    this.userSvc.getAll().subscribe(users => {
      this.userMap = {}
      users.forEach(u => this.userMap[u.id] = u.username)
      this.load();
    })
  }

  load() {
    this.loading = true;
    this.svc.getAllShifts()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: all => {
          this.list = all;
          const uniqueShiftTypes = new Set(all.map(s => s.shift));

          const shiftOptions = Array.from(uniqueShiftTypes).map(type => ({
            value: type,
            label: type
          }));

          const shiftTypeConfig = this.shiftFilterConfig.find(c => c.name === 'type');
          if (shiftTypeConfig) {
            shiftTypeConfig.options = shiftOptions;
          }

          this.applyFilter();
        },
        error: err => this.error = err ?? 'Failed to load shifts'
      });
  }

  onFilterChange(filters: Record<string, any>) {
    this.activeFilters = filters;
    this.applyFilter();
  }

  applyFilter() {
    const usernameFilter = (this.activeFilters['username'] || '').toLowerCase();
    const dateFilter = this.activeFilters['date'] || '';
    const shiftTypeFilter = this.activeFilters['type'] || '';

    this.filtered = this.list.filter(s => {
      const username = (this.userMap[s.userId] || '').toLowerCase();

      const matchesName = usernameFilter ? username.includes(usernameFilter) : true;
      const matchesDate = dateFilter ? s.date === dateFilter : true;
      const matchesShiftType = shiftTypeFilter ? s.shift === shiftTypeFilter : true;

      return matchesName && matchesDate && matchesShiftType
    })
  }

  startEdit(a: ShiftAssignment) {
    this.editId = a.id;
    this.editMap[a.id] = {
      shift:     a.shift,
      startTime: a.startTime,
      endTime:   a.endTime
    };
    this.error = '';
  }

  saveEdit(a: ShiftAssignment) {
    const upd = this.editMap[a.id]!;
    this.svc.updateShift(a.id, {
      shift:     upd.shift,
      startTime: upd.startTime,
      endTime:   upd.endTime
    }).subscribe({
      next: () => {
        a.shift     = upd.shift!;
        a.startTime = upd.startTime!;
        a.endTime   = upd.endTime!;
        this.cancelEdit();
      },
      error: err => this.error = err ?? 'Update failed'
    });
  }

  cancelEdit() {
    if (this.editId) {
      delete this.editMap[this.editId];
      this.editId = undefined;
    }
    this.error = '';
  }

  startDelete(a: ShiftAssignment) {
    this.deleteId = a.id;
    this.error = '';
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.loading = true;
    this.svc.deleteShift(this.deleteId)
      .pipe(finalize(() => {
        this.loading = false;
        this.deleteId = undefined;
      }))
      .subscribe({
        next: () => this.load(),
        error: err => this.error = err ?? 'Delete failed'
      });
  }
}
