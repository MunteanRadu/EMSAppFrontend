// src/app/shared/services/punch-record.service.ts
import { Injectable }    from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../environments/environment';
import { Observable }    from 'rxjs';
import { PunchRecord }   from '../models/punch-record.model';
import { DaySummary } from '../models/day-summary.model';
import { BreakSession } from '../models/break-session.model';

@Injectable({ providedIn: 'root' })
export class PunchRecordService {
  private base = `${environment.apiUrl}/punchrecords`;

  constructor(private http: HttpClient) {}

  punchIn(userId: string): Observable<PunchRecord> {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const body = {
      userId,
      date,
      timeIn: time
    }
    return this.http.post<PunchRecord>(
      this.base,
      body
    );
  }

  punchOut(recordId: string): Observable<PunchRecord> {
    const now = new Date();
    const time = now.toTimeString().slice(0,8) // HH:MM:SS
    const body = {
      timeOut: time
    }
    return this.http.post<PunchRecord>(
      `${this.base}/${recordId}/punchout`,
      body
    );
  }

  getBreaks(punchId: string): Observable<BreakSession[]> {
    return this.http.get<BreakSession[]>(
      `${this.base}/${punchId}/breaksessions`
    );
  }

  getMonthSummaries(userId: string, year: number, month: number)
    : Observable<DaySummary[]> {
    return this.http.get<DaySummary[]>(
      `${this.base}/summary`,
      { params: { userId, year: String(year), month: String(month) } }
    );
  }

  /** GET full punch records for a single date */
  getByDate(userId: string, date: string)
    : Observable<PunchRecord[]> {
    return this.http.get<PunchRecord[]>(
      `${this.base}/today?userId=${userId}&date=${date}`
    );
  }

  startBreak(punchId: string): Observable<BreakSession> {
    const now       = new Date();
    const startTime = now.toTimeString().slice(0, 8);
    return this.http.post<BreakSession>(
      `${this.base}/${punchId}/breaksessions`,
      { startTime }
    );
  }

  endBreak(punchId: string, breakId: string): Observable<BreakSession> {
    const now     = new Date();
    const endTime = now.toTimeString().slice(0, 8);
    return this.http.patch<BreakSession>(
      `${this.base}/${punchId}/breaksessions/${breakId}`,
      { endTime }
    );
  }

  /** ADMIN: fetch *all* punch records */
  getAll(): Observable<PunchRecord[]> {
    return this.http.get<PunchRecord[]>(`${this.base}`);
  }

  update(
    id: string,
    payload: {
      date?: string;
      timeIn?: string;
      timeOut?: string;
    }
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, payload);
  }

  /** ADMIN: delete a punch record by its id */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}