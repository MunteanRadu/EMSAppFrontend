import { LeaveType } from "./leave-request.model";

export interface Policy {
  year:          string;
  workDayStart:   string;
  workDayEnd:     string;
  punchInTolerance: string;
  punchOutTolerance: string;
  maxSingleBreak: string;
  maxTotalBreakPerDay:  string;
  overtimeMultiplier: string;
  leaveQuotas: Record<LeaveType, number>;
}

export interface PolicyCreateRequest{
  year: number;
  workDayStart:   string;
  workDayEnd:     string;
  punchInTolerance: string;
  punchOutTolerance: string;
  maxSingleBreak: string;
  maxTotalBreakPerDay:  string;
  overtimeMultiplier: number;
  leaveQuotas: Record<LeaveType, number>;
}