import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Policy, PolicyCreateRequest }     from '../models/policy.model';
import { environment } from '../../../environments/environment';
import { LeaveType } from '../models/leave-request.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {

  create(payload: PolicyCreateRequest): Observable<Policy> { 
    return this.http.post<Policy>(this.base, payload); 
  }

  updateQuotas(id: string, leaveQuotas: Record<LeaveType, number>
    ): Observable<Policy> {
    return this.http.patch<Policy>(`${this.base}/${id}/quotas`, { leaveQuotas });
  }
  
  update(id: string, 
    payload: {
      workDayStart: string,
      workDayEnd: string,
      punchInTolerance: string,
      punchOutTolerance: string,
      maxSingleBreak: string,
      maxTotalBreakPerDay: string,
      overtimeMultiplier: string,
      leaveQuotas: Record<LeaveType, number>
    }
  ): Observable<Policy> {
    return this.http.put<Policy>(`${this.base}/${id}`, payload);
  }
  private base = `${environment.apiUrl}/policies`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Policy[]> { 
    return this.http.get<Policy[]>(`${this.base}`); 
  }

  getByYear(year: number): Observable<Policy> {
    return this.http.get<Policy>(`${this.base}/${year}`);
  }

  delete(id:string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
