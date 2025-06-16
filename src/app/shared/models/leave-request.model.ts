export type LeaveType   = 'annual' | 'compassionate' | 'parental' | 'paid' | 'unpaid' | 'sick' | 'toil' | 'academic' | 'misc';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  managerId?: string;
  requestedAt: string;
  decisionAt?: string;
  completedAt?:string;
}
