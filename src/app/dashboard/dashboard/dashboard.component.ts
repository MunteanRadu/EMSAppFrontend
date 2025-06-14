import { Component, OnInit }                    from '@angular/core';
import { forkJoin, of }                         from 'rxjs';
import { finalize }                             from 'rxjs/operators';
import { CommonModule }                         from '@angular/common';
import { RouterModule, Router }                 from '@angular/router';

import { AuthService }                          from '../../auth/auth.service';
import { UserService }                          from '../../shared/services/user.service';
import { PunchRecordService }                   from '../../shared/services/punch-record.service';
import { LeaveRequestService }                  from '../../shared/services/leave-request.service';
import { ScheduleService }                      from '../../shared/services/schedule.service';
import { AssignmentService }                    from '../../shared/services/assignment.service';
import { WeeklyShift }                          from '../../shared/models/weekly-shift.model';
import { BreakSession }                         from '../../shared/models/break-session.model';
import { Assignment }                           from '../../shared/models/assignment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  username        = '';
  todaysPunches   = [] as any[];
  todayBreaks: Record<string, BreakSession[]> = {};
  totalHoursToday = '00:00:00';
  upcomingShifts  = [] as WeeklyShift[];
  ongoingTasks    = [] as (Assignment & { isOverdue: boolean })[];
  isManager       = false;
  hasActiveLeave  = false;

  nextAction: 'In'|'Out' = 'In';
  lastRecordId?: string;
  loadingPunch    = false;
  punchError      = '';

  constructor(
    private auth:        AuthService,
    private userSvc:     UserService,
    private punches:     PunchRecordService,
    private leaveSvc:    LeaveRequestService,
    private schedules:   ScheduleService,
    private assignments: AssignmentService,
    private router:      Router
  ) {}

  ngOnInit() {
    const token   = this.auth.token!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roleRaw = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
    this.isManager = roleRaw.toLowerCase() === 'manager';
    const userId   = payload.sub as string;

    //  load leave status
    this.leaveSvc.listByUser(userId).subscribe(leaves => {
      const todayMs = this.todayMidnight().getTime();
      this.hasActiveLeave = leaves.some(l =>
        l.status.toLowerCase() === 'approved' &&
        this.isoToMidnight(l.startDate) <= todayMs &&
        this.isoToMidnight(l.endDate)   >= todayMs
      );
    });

    // load punch/break state
    this.loadTodayRecords();

    // parallel: schedules & tasks
    this.userSvc.getById(userId).subscribe({
      next: user => {
        this.username = user.username;
        const deptId  = user.departmentId;

        const now      = new Date();
        const yyyy     = now.getFullYear();
        const mm       = String(now.getMonth()+1).padStart(2,'0');
        const dd       = String(now.getDate()).padStart(2,'0');
        const today    = `${yyyy}-${mm}-${dd}`;

        const weekStart    = this.getMonday(now);
        const weekStartIso = this.toIsoDate(weekStart);

        forkJoin({
          shifts: !this.isManager && deptId
            ? this.schedules.getUserSchedule(userId, weekStartIso)
            : of([]),
          tasks: this.assignments.getByStatus('InProgress')
        }).subscribe({
          next: ({ shifts, tasks }) => {
            // tasks
            const todayIso = today;
            this.ongoingTasks = tasks.map(t => ({
              ...t,
              isOverdue:
                t.status === 'InProgress' &&
                new Date(t.dueDate) < new Date(todayIso)
            }));

            // shifts
            this.upcomingShifts = (shifts ?? []).map(s => ({
              ...s,
              day: this.isoToDayName(s.date)
            }));
          },
          error: err => console.error('Dashboard load failed', err)
        });
      },
      error: err => {
        console.error('Failed to load user', err);
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  private loadTodayRecords() {
    const userId = this.authUserId;
    const now    = new Date();
    const y      = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,'0'), d = String(now.getDate()).padStart(2,'0');
    const today  = `${y}-${m}-${d}`;

    this.punches.getByDate(userId, today)
      .subscribe(records => {
        this.todaysPunches = records;
        const totalSec = records.reduce((sum, r) => {
          if (!r.totalHours) return sum;
          const [h,mm,ss] = r.totalHours.split(':').map(x=>parseInt(x,10));
          return sum + h*3600 + mm*60 + ss;
        }, 0);
        this.totalHoursToday = this.formatTimespan(totalSec);
        
        const last = records[records.length-1];
        if (!last || last.timeOut) {
          this.nextAction   = 'In';
          this.lastRecordId = undefined;
        } else {
          this.nextAction   = 'Out';
          this.lastRecordId = last.id;
        }
        this.todayBreaks = {};
        records.forEach(r =>
          this.punches.getBreaks(r.id)
            .subscribe(bs => this.todayBreaks[r.id] = bs)
        );
      });
  }

  onPunch() {
    const userId = this.authUserId;
    this.loadingPunch = true;
    this.punchError   = '';
    const op$ = this.nextAction === 'In'
      ? this.punches.punchIn(userId)
      : this.punches.punchOut(this.lastRecordId!);
    op$.pipe(finalize(() => this.loadingPunch = false))
      .subscribe({
        next: () => this.loadTodayRecords(),
        error: e => this.punchError = e ?? 'Operation failed.'
      });
  }

  get canPunchOut(): boolean {
    return this.nextAction === 'Out' && !this.canEndBreak;
  }

  get canStartBreak(): boolean {
    if (this.nextAction !== 'Out' || !this.lastRecordId) return false;
    const bs = this.todayBreaks[this.lastRecordId]||[];
    return !bs.some(x => !x.endTime);
  }

  get canEndBreak(): boolean {
    if (this.nextAction !== 'Out' || !this.lastRecordId) return false;
    const bs = this.todayBreaks[this.lastRecordId]||[];
    return bs.some(x => !x.endTime);
  }

  onStartBreak() {
    this.loadingPunch = true;
    this.punches.startBreak(this.lastRecordId!)
      .pipe(finalize(() => this.loadingPunch = false))
      .subscribe(() => this.loadTodayRecords());
  }

  onEndBreak() {
    const bs = this.todayBreaks[this.lastRecordId!]||[];
    const open = bs.find(x => !x.endTime);
    if (!open) return;
    this.loadingPunch = true;
    this.punches.endBreak(this.lastRecordId!, open.id)
      .pipe(finalize(() => this.loadingPunch = false))
      .subscribe(() => this.loadTodayRecords());
  }

  private get authUserId(): string {
    const payload = JSON.parse(atob(this.auth.token!.split('.')[1]));
    return payload.sub as string;
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day  = date.getDay();
    const diff = date.getDate() - day + (day===0? -6:1);
    return new Date(date.setDate(diff));
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().slice(0,10);
  }

  private isoToDayName(iso: string): string {
    const dt = new Date(iso);
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return names[dt.getDay()];
  }

  private todayMidnight(): Date {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }

  private isoToMidnight(iso: string): number {
    const d = new Date(iso);
    d.setHours(0,0,0,0);
    return d.getTime();
  }

  private parseSeconds(ts: string): number {
    const [h,m,s] = ts.split(':').map(x=>parseInt(x,10));
    return h*3600 + m*60 + s;
  }

  private formatTimespan(sec: number): string {
    const h = Math.floor(sec/3600),
          m = Math.floor((sec%3600)/60),
          s = sec%60;
    return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
