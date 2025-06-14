export interface BreakSession {
  id: string;
  punchRecordId: string;
  startTime: string;    // "HH:mm:ss"
  endTime?: string;     // "HH:mm:ss"
  duration?: string;    // "HH:mm:ss"
  isNonCompliant: boolean;
}