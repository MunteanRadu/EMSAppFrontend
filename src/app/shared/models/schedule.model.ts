export interface Schedule {
  id: string;
  departmentId: string;
  managerId: string;
  day: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  exceptions?: string[];
}

export interface CreateScheduleRequest {
  departmentId: string;
  managerId: string;
  day: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface UpdateScheduleRequest {
  startTime?: string;
  endTime?: string;
  isWorkingDay?: boolean;
}

export interface ScheduleExceptionRequest {
  exceptionDate: string;
}