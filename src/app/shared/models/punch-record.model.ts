export interface PunchRecord {
  id: string;
  userId: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  totalHours?: string;
  isNonCompliant: boolean;
}