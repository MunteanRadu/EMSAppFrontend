// src/app/shared/services/schedule.service.ts
import { Injectable }     from '@angular/core';
import { HttpClient }     from '@angular/common/http';
import { Observable }     from 'rxjs';
import { environment }    from '../../../environments/environment';
import { WeeklyShift } from '../models/weekly-shift.model';
import { ShiftAssignment } from '../models/shift-assignment';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private base = `${environment.apiUrl}/shifts`;

  constructor(private http: HttpClient) {}

  getAllShifts(): Observable<ShiftAssignment[]> {
    return this.http.get<ShiftAssignment[]>(`${this.base}`);
  }

  getUserSchedule(userId: string, weekStart: string): Observable<WeeklyShift[]> {
    return this.http.get<WeeklyShift[]>(
      `${this.base}/user/${userId}?weekStart=${weekStart}`
    );
  }

  /** Ask the AI endpoint to generate a weekly schedule, then save it */
  aiGenerateWeeklySchedule(departmentId: string, weekStart: string): Observable<any> {
    return this.http.post(`${this.base}/${departmentId}/ai-generate?weekStart=${weekStart}`, {});
  }

  /** Create a new shift assignment */
  createShift(a: {
    userId: string;
    date: string;
    shift: string;
    startTime: string;
    endTime: string;
    departmentId: string;
    managerId: string;
  }): Observable<ShiftAssignment> {
    return this.http.post<ShiftAssignment>(`${this.base}`, a);
  }

  /** Update shift times or type */
  updateShift(id: string, payload: {
    shift?: string;
    startTime?: string;
    endTime?: string;
  }): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, payload);
  }

  /** Delete a shift assignment */
  deleteShift(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
