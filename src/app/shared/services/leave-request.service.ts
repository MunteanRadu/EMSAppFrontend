// src/app/shared/services/leave-request.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LeaveRequest,
  LeaveType,
  LeaveStatus
} from '../models/leave-request.model';

interface CreateLeavePayload {
  userId:    string;
  type:      LeaveType;
  startDate: string;
  endDate:   string;
  reason:    string;
}

@Injectable({ providedIn: 'root' })
export class LeaveRequestService {
  private base = `${environment.apiUrl}/leaverequests`;

  constructor(private http: HttpClient) {}

  /** Employee: create a new request */
  create(payload: CreateLeavePayload): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(this.base, payload);
  }

  /** Employee: list their requests */
  listByUser(userId: string): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(
      `${this.base}/listBySomething?userId=${userId}`
    );
  }

  /** Manager: list all pending */
  listPending(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(
      `${this.base}/listBySomething?status=Pending`
    );
  }

  /** Manager: list history (approved/rejected/completed) */
  listByStatus(status: LeaveStatus): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(
      `${this.base}/listBySomething?status=${status}`
    );
  }

  /** Manager: approve a leave */
  approve(id: string, managerId: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(
      `${this.base}/${id}/approve?managerId=${managerId}`, {}
    );
  }

  /** Manager: reject a leave */
  reject(id: string, managerId: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(
      `${this.base}/${id}/reject?managerId=${managerId}`, {}
    );
  }

  /** ADMIN: list *all* leave requests */
  listAll(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(this.base);
  }

  update(
    id: string,
    payload: {
      type?: string;
      startDate?: string;
      endDate?: string;
      reason?: string;
    }
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, payload);
  }

  /** ADMIN: delete a leave request */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
