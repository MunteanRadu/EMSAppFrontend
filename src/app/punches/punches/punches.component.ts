// src/app/punches/punches/punches.component.ts
import { Component, OnInit }   from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';
import { finalize }             from 'rxjs/operators';

import { AuthService }          from '../../auth/auth.service';
import { PunchRecordService }   from '../../shared/services/punch-record.service';
import { PunchRecord }          from '../../shared/models/punch-record.model';
import { DaySummary }           from '../../shared/models/day-summary.model';
import { LeaveRequestService }  from '../../shared/services/leave-request.service';
import { BreakSession } from '../../shared/models/break-session.model';

@Component({
  selector: 'app-punches',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './punches.component.html',
  styleUrls: ['./punches.component.scss']
})
export class PunchesComponent implements OnInit {
  hasActiveLeave = false;
  todayRecords: PunchRecord[] = [];
  todayBreaks: { [punchId: string]: BreakSession[] } = {};
  nextAction:   'In' | 'Out'  = 'In';
  loading = false;
  lastRecordId?: string;
  private userId!: string;

  currentYear     = new Date().getFullYear();
  currentMonth    = new Date().getMonth() + 1;
  monthSummaries: DaySummary[] = [];
  loadingMonth    = false;

  selectedDate     = '';
  dayRecords:      PunchRecord[] = [];
  dayBreaks: { [punchId: string]: BreakSession[] } = {};
  totalSecondsDay  = 0;
  dayHasBreaks     = false;
  loadingDay       = false;

  constructor(
    private auth:    AuthService,
    private punches: PunchRecordService,
    private leave:   LeaveRequestService
  ) {}

  ngOnInit() {
    const payload = JSON.parse(atob(this.auth.token!.split('.')[1]));
    this.userId = payload.sub;
    this.leave.listByUser(this.userId).subscribe(leaves => {
      const todayMs = this.todayMidnight().getTime();
      this.hasActiveLeave = leaves.some(l => {
        if (l.status !== 'approved') return false;
        const start = this.isoToMidnight(l.startDate);
        const end   = this.isoToMidnight(l.endDate);
        return start <= todayMs && todayMs <= end;
      });
    });
    this.loadTodayRecords();
    this.loadMonth();
  }

  /** Load only today’s punches via getByDate */
  private loadTodayRecords() {
    const now     = new Date();
    const yyyy    = now.getFullYear();
    const mm      = String(now.getMonth()+1).padStart(2,'0');
    const dd      = String(now.getDate()).padStart(2,'0');
    const today   = `${yyyy}-${mm}-${dd}`;

    this.punches.getByDate(this.userId, today)
      .subscribe(records => {
        this.todayRecords = records;
        this.updateNextAction(records);

        // load breaks per record
        this.todayBreaks = {};
        records.forEach(r => {
          this.punches.getBreaks(r.id).subscribe(breaks => {
            this.todayBreaks[r.id] = breaks;
          });
        });
      });
  }

  /** Decide whether next action is In or Out */
  private updateNextAction(records: PunchRecord[]) {
    const last = records[records.length - 1];
    if (!last || last.timeOut) {
      this.nextAction   = 'In';
      this.lastRecordId = undefined;
    } else {
      this.nextAction   = 'Out';
      this.lastRecordId = last.id;
    }
  }

  errorMessage = '';

  onPunch() {
    this.loading = true;
    this.errorMessage = '';
    const op$ = this.nextAction==='In'
      ? this.punches.punchIn(this.userId)
      : this.punches.punchOut(this.lastRecordId!);

    op$.pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => this.loadTodayRecords(),
        error: err => {
          this.errorMessage = err ?? 'Operation failed.';
        }
      });
  }

  get canStartBreak(): boolean {
    if (this.nextAction !== 'Out' || !this.lastRecordId) return false;
    const breaks = this.todayBreaks[this.lastRecordId] ?? [];
    return !breaks.some(bs => !bs.endTime);
  }

  /** True if there's an active punch AND an open break */
  get canEndBreak(): boolean {
    if (this.nextAction !== 'Out' || !this.lastRecordId) return false;
    const breaks = this.todayBreaks[this.lastRecordId] ?? [];
    return breaks.some(bs => !bs.endTime);
  }

  get canPunchOut(): boolean {
  if (this.nextAction !== 'Out' || !this.lastRecordId) return false;
  const breaks = this.todayBreaks[this.lastRecordId] ?? [];
  return !breaks.some(bs => !bs.endTime);
}


  onStartBreak() {
    if (!this.lastRecordId) return;
    this.loading = true;
    this.punches.startBreak(this.lastRecordId)
      .pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadTodayRecords());
  }

  onEndBreak() {
    if (!this.lastRecordId) return;
    const breaks = this.todayBreaks[this.lastRecordId!] ?? [];
    const open = breaks.find(bs => !bs.endTime);
    if (!open) return;
    this.loading = true;
    this.punches.endBreak(this.lastRecordId, open.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadTodayRecords());
  }

  /** Load summaries for the current month */
  loadMonth() {
    this.loadingMonth = true;
    this.punches
      .getMonthSummaries(this.userId, this.currentYear, this.currentMonth)
      .pipe(finalize(() => this.loadingMonth = false))
      .subscribe(s => {
        this.monthSummaries = s;
        // if selectedDate no longer in this month, clear detail
        if (!s.find(ds => ds.date === this.selectedDate)) {
          this.clearDetail();
        }
      });
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth === 0) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.loadMonth();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth === 13) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    this.loadMonth();
  }

  /** true if not already in current month */
  get canGoNext(): boolean {
    const now = new Date();
    return !(
      this.currentYear  === now.getFullYear() &&
      this.currentMonth === now.getMonth() + 1
    );
  }

  /** User clicked a day in the calendar */
  selectDay(date: string) {
    this.selectedDate = date;
    this.loadDay(date);
  }

  /** Load full records for one date */
  loadDay(date: string) {
    this.loadingDay = true;
    this.punches.getByDate(this.userId, date)
      .pipe(finalize(() => this.loadingDay = false))
      .subscribe(records => {
        this.dayRecords = records;

        this.dayBreaks = {};
        records.forEach(r => {
          this.punches.getBreaks(r.id).subscribe(breaks => {
            this.dayBreaks[r.id] = breaks;
          });
        });

        this.dayHasBreaks = false;

        this.totalSecondsDay = records
          .reduce((sum, r) =>
            sum + this.parseTimespanToSeconds(r.totalHours ?? '00:00:00'),
            0
          );
      });
  }

  clearDetail() {
    this.selectedDate    = '';
    this.dayRecords      = [];
    this.totalSecondsDay = 0;
    this.dayHasBreaks    = false;
  }

  /** Build a 1…N list of days for template, with local dateStr */
  get calendarDays() {
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day     = i + 1;
      const dateObj = new Date(this.currentYear, this.currentMonth - 1, day);
      const yyyy    = dateObj.getFullYear();
      const mm      = String(dateObj.getMonth()+1).padStart(2,'0');
      const dd      = String(dateObj.getDate()).padStart(2,'0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const ds      = this.monthSummaries.find(x => x.date === dateStr);
      return { dateObj, dateStr, hasPunches: ds?.hasPunches ?? false };
    });
  }

  /** Helpers to convert "HH:mm:ss" ↔ seconds */
  private parseTimespanToSeconds(ts: string): number {
    const [h,m,s] = ts.split(':').map(x => parseInt(x, 10));
    return h * 3600 + m * 60 + s;
  }

  readonly weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  get blanks(): undefined[] {
    const firstOfMonth = new Date(this.currentYear, this.currentMonth - 1, 1);
    const dow = firstOfMonth.getDay();
    return Array(dow).fill(undefined);
  }

  formatSecondsToTimespan(total: number): string {
    const h = Math.floor(total/3600);
    const m = Math.floor((total % 3600)/60);
    const s = total % 60;
    return [h,m,s].map(n => String(n).padStart(2,'0')).join(':');
  }

  private todayMidnight(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private isoToMidnight(iso: string): number {
    const d = new Date(iso);
    d.setHours(0,0,0,0);
    return d.getTime();
  }
}
