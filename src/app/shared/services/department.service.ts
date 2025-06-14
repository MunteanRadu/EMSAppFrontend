import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Department } from '../models/department.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private base = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) {}

  getById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.base}/${id}`);
  }
  
  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(this.base);
  }

  create(name: string): Observable<Department> { 
    return this.http.post<Department>(this.base, { name }); 
  }

  update(id:string, 
    payload: {
      name?: string;
    }
  ): Observable<void> {
   return this.http.put<void>(`${this.base}/${id}`, payload); 
  }

  delete(id:string): Observable<void> { 
    return this.http.delete<void>(`${this.base}/${id}`); 
  }

  addEmployee(userId: string, deptId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${deptId}/employees`, { userId });
  }

  removeEmployee(userId: string, deptId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${deptId}/employees/${userId}`);
  }
}
