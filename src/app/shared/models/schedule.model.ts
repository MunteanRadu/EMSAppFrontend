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

interface UserDaySchedule {
  date: string;
  dayOfWeek: string;
  startTime: string|null;
  endTime: string|null;
  isWorking: boolean;
}

interface DeptDaySchedule {
  date: string;
  dayOfWeek: string;
  workingUsernames: string[];
}
