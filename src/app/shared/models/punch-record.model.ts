import { BreakSession } from "./break-session.model";

export interface PunchRecord {
  id: string;
  userId: string;
  date: string;         // "YYYY-MM-DD"
  timeIn: string;       // "HH:mm:ss"
  timeOut?: string;     // "HH:mm:ss"
  totalHours?: string;  // "HH:mm:ss"
  isNonCompliant: boolean;
}