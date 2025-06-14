// src/app/shared/models/leave-request.model.ts
export type LeaveType   = 'annual' | 'compassionate' | 'parental' | 'paid' | 'unpaid' | 'sick' | 'toil' | 'academic' | 'misc';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface LeaveRequest {
  id:          string;
  userId:      string;
  type:        LeaveType;
  startDate:   string;   // "YYYY-MM-DD"
  endDate:     string;   // "YYYY-MM-DD"
  reason:      string;
  status:      LeaveStatus;
  managerId?:  string;
  requestedAt: string;   // ISO timestamp
  decisionAt?: string;
  completedAt?:string;
}
