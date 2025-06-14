import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, mergeMap, tap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../shared/services/user.service';
import { ScheduleService } from '../../shared/services/schedule.service';
import { DepartmentService } from '../../shared/services/department.service';
import { WeeklyShift } from '../../shared/models/weekly-shift.model';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class SchedulesComponent implements OnInit {
  userId = '';
  isManager = false;

  weekStart!: Date;
  currentWeekStartIso = '';

  shifts: WeeklyShift[] = [];

  employees: string[] = [];
  matrix: Array<{ userId: string; username: string; shifts: Record<string, WeeklyShift> }> = [];
  days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  departmentId = '';
  departmentName = '';

  constructor(
    private auth: AuthService,
    private userSvc: UserService,
    private scheduleSvc: ScheduleService,
    private deptSvc: DepartmentService
  ) {}

  ngOnInit() {
    const token = this.auth.token!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.userId = payload.sub as string;
    const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    this.isManager = ['admin','manager'].some(r => roles.includes(r));

    this.userSvc.getById(this.userId).pipe(
      tap(user => this.departmentId = user.departmentId),
      mergeMap(() => this.deptSvc.getById(this.departmentId))
    ).subscribe(dept => {
      this.departmentName = dept.name;
      this.weekStart = this.getMonday(new Date());
      this.currentWeekStartIso = this.toIsoDate(this.weekStart);
      this.load();
    });
  }

  private load() {
    this.isManager
      ? this.loadDepartmentWeekly()
      : this.loadUserWeekly();
  }

  /** Employee view */
  loadUserWeekly() {
    this.scheduleSvc
      .getUserSchedule(this.userId, this.currentWeekStartIso)
      .pipe(
        map(list =>
          list.map(s => ({
            ...s,
            day: this.isoToDayName(s.date)
          }))
        )
      )
      .subscribe(mapped => this.shifts = mapped);
  }

  loadDepartmentWeekly() {
    this.deptSvc.getById(this.departmentId).pipe(
      tap(d => this.employees = d.employees || []),
      mergeMap(d => {
        const userCalls = (d.employees || []).map(id => this.userSvc.getById(id));
        return forkJoin(userCalls);
      }),
      mergeMap((users: User[]) => {
        const calls = users.map(u =>
          this.scheduleSvc
            .getUserSchedule(u.id, this.currentWeekStartIso)
            .pipe(
              map(list => ({
                userId: u.id,
                username: u.username,
                shifts: list.map(s => ({ ...s, day: this.isoToDayName(s.date) }))
              }))
            )
        );
        return forkJoin(calls);
      })
    ).subscribe(results => {
      this.matrix = results.reduce((acc, r) => {
        const shiftMap: Record<string, WeeklyShift> = {};
        r.shifts.forEach(s => shiftMap[s.day] = s);
        acc.push({ userId: r.userId, username: r.username, shifts: shiftMap });
        return acc;
      }, [] as Array<{ userId: string; username: string; shifts: Record<string, WeeklyShift> }>);
    });
  }

  /** AI‐generate & reload */
  generateAI() {
    this.scheduleSvc
      .aiGenerateWeeklySchedule(this.departmentId, this.currentWeekStartIso)
      .subscribe(() => this.loadDepartmentWeekly());
  }

  /** Week navigation */
  previousWeek() {
    this.weekStart.setDate(this.weekStart.getDate() - 7);
    this.currentWeekStartIso = this.toIsoDate(this.weekStart);
    this.load();
  }
  nextWeek() {
    this.weekStart.setDate(this.weekStart.getDate() + 7);
    this.currentWeekStartIso = this.toIsoDate(this.weekStart);
    this.load();
  }

  /** Helpers */
  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day  = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
  private toIsoDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }
  private isoToDayName(iso: string): string {
    const dt    = new Date(iso);
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return names[dt.getDay()];
  }
}
