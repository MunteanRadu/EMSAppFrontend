import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PolicyService } from '../../shared/services/policy-service.service';
import { Policy, PolicyCreateRequest } from '../../shared/models/policy.model';
import { LeaveType } from '../../shared/models/leave-request.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-policies',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-policies.component.html',
  styleUrls: ['./manage-policies.component.scss']
})
export class ManagePoliciesComponent implements OnInit {
  list: Policy[] = [];
  policy: Policy | null = null;
  newYear = '';
  newWorkDayStart = '';
  newWorkDayEnd = '';
  newPunchInTolerance = '';
  newPunchOutTolerance = '';
  newMaxSingleBreak = '';
  newMaxTotalBreakPerDay = '';
  newOvertimeMultiplier = '';
  newLeaveQuotas: Record<LeaveType, number> = {
    annual: 0,
    compassionate: 0,
    parental: 0,
    paid: 0,
    unpaid: 0,
    sick: 0,
    toil: 0,
    academic: 0,
    misc: 0
  };
  loading = false;
  error = '';

  editId?: string;
  deleteId?: string;
  editQuotasId?: string;
  activeEditMode: 'row' | 'quotas' | null = null;
  editMap: Record<string, Partial<Policy>> = {};

  leaveTypes: LeaveType[] = [
    'annual', 'compassionate', 'parental', 'paid', 'unpaid', 'sick', 'toil', 'academic', 'misc'
  ];

  constructor(private svc: PolicyService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: p => this.list = p,
        error: err => this.error = err ?? 'Load failed'
      });
  }

  

  create() {
    // 1) parse the numeric fields into actual numbers
    // 2) call fixTime(...) on every string that the backend will treat as TimeOnly or TimeSpan.
    const payload: PolicyCreateRequest = {
      year: Number(this.newYear),
      workDayStart: this.fixTime(this.newWorkDayStart),
      workDayEnd: this.fixTime(this.newWorkDayEnd),
      punchInTolerance: this.fixTime(this.newPunchInTolerance),
      punchOutTolerance: this.fixTime(this.newPunchOutTolerance),
      maxSingleBreak: this.fixTime(this.newMaxSingleBreak),
      maxTotalBreakPerDay: this.fixTime(this.newMaxTotalBreakPerDay),
      overtimeMultiplier: parseFloat(this.newOvertimeMultiplier),
      leaveQuotas: this.newLeaveQuotas   // e.g. { annual: 20, compassionate: 5, ... }
    };

    // If any of the numeric parses resulted in NaN, bail out
    if (isNaN(payload.year) || isNaN(payload.overtimeMultiplier)) {
      this.error = 'Year and overtime multiplier must be valid numbers';
      return;
    }

    this.svc.create(payload).subscribe({
      next: () => {
        // Reset all form fields
        this.newYear = '';
        this.newWorkDayStart = '';
        this.newWorkDayEnd = '';
        this.newPunchInTolerance = '';
        this.newPunchOutTolerance = '';
        this.newMaxSingleBreak = '';
        this.newMaxTotalBreakPerDay = '';
        this.newOvertimeMultiplier = '';
        this.newLeaveQuotas = {
          annual: 0,
          compassionate: 0,
          parental: 0,
          paid: 0,
          unpaid: 0,
          sick: 0,
          toil: 0,
          academic: 0,
          misc: 0
        };
        this.load();
        this.error = '';
      },
      error: err => {
        this.error = err ?? 'Create failed';
      }
    });
  }

  startEdit(p: Policy) {
    this.activeEditMode = 'row';
    this.editId = p.year;
    this.editMap[p.year] = {
      workDayStart: p.workDayStart,
      workDayEnd: p.workDayEnd,
      punchInTolerance: p.punchInTolerance,
      punchOutTolerance: p.punchOutTolerance,
      maxSingleBreak: p.maxSingleBreak,
      maxTotalBreakPerDay: p.maxTotalBreakPerDay,
      overtimeMultiplier: p.overtimeMultiplier,
      leaveQuotas: { ...p.leaveQuotas }
    };
  }

  saveEdit(p: Policy) {
    const buf = this.editMap[p.year];
    this.svc.update(p.year, {
      workDayStart: this.fixTime(buf.workDayStart),
      workDayEnd: this.fixTime(buf.workDayEnd),
      punchInTolerance: buf.punchInTolerance!,
      punchOutTolerance: buf.punchOutTolerance!,
      maxSingleBreak: buf.maxSingleBreak!,
      maxTotalBreakPerDay: buf.maxTotalBreakPerDay!,
      overtimeMultiplier: buf.overtimeMultiplier!,
      leaveQuotas: buf.leaveQuotas!
    }).subscribe(() => {
      if(buf.workDayStart !== undefined) p.workDayStart = buf.workDayStart;
      if(buf.workDayEnd !== undefined) p.workDayEnd = buf.workDayEnd;
      if(buf.punchInTolerance !== undefined) p.punchInTolerance = buf.punchInTolerance;
      if(buf.punchOutTolerance !== undefined) p.punchOutTolerance = buf.punchOutTolerance;
      if(buf.maxSingleBreak !== undefined) p.maxSingleBreak = buf.maxSingleBreak;
      if(buf.maxTotalBreakPerDay !== undefined) p.maxTotalBreakPerDay = buf.maxTotalBreakPerDay;
      if(buf.overtimeMultiplier !== undefined) p.overtimeMultiplier = buf.overtimeMultiplier;
      if(buf.leaveQuotas !== undefined) p.leaveQuotas = buf.leaveQuotas;
      this.activeEditMode = null;
      delete this.editMap[p.year];
      this.error = '';
    });
  }

  cancelEdit() {
    delete this.editMap[this.editId!];
    this.activeEditMode = null;
    this.editId = undefined;
  }

  startDelete(p: Policy) {
    this.deleteId = p.year;
  }

  confirmDelete(p: Policy) {
    this.loading = true;
    this.svc.delete(p.year).pipe(finalize(() => {
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

  startEditQuotas(p: Policy) {
    this.activeEditMode = 'quotas';
    this.editQuotasId = p.year;
    if (!this.editMap[p.year]) {
      this.editMap[p.year] = {
        leaveQuotas: { ...p.leaveQuotas }
      };
    }
  }

  saveEditQuotas(p: Policy) {
    const buf = this.editMap[p.year];
    this.svc.updateQuotas(p.year, buf.leaveQuotas!).subscribe(() => {
      p.leaveQuotas = { ...buf.leaveQuotas! };
      this.activeEditMode = null;
      this.editQuotasId = undefined;
      delete this.editMap[p.year];
      this.error = '';
    });
  }

cancelEditQuotas() {
  this.activeEditMode = null;
  this.editQuotasId = undefined;
}


  leaveQuotaKeys(obj: Record<LeaveType, number>): LeaveType[] {
    return this.leaveTypes;
  }

  private fixTime(t: string | undefined): string {
    if (!t) return '00:00:00';
    return t.length === 5 ? t + ':00' : t;
  }
}
