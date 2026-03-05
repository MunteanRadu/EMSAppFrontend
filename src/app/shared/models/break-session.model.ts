export interface BreakSession {
  id: string;
  punchRecordId: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  isNonCompliant: boolean;
}