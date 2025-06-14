// src/app/admin/admin.module.ts
import { NgModule }         from '@angular/core';
import { CommonModule }     from '@angular/common';
import { RouterModule }     from '@angular/router';
import { FormsModule }      from '@angular/forms';
import { AuthGuard } from '../../auth/guards/auth.guard'; 

import { AdminLayoutComponent }       from '../admin-layout/admin-layout.component';
import { ManageEmployeesComponent } from '../manage-employees/manage-employees.component'; 
import { ManageManagersComponent } from '../manage-managers/manage-managers.component';
import { ManageDepartmentsComponent } from '../manage-departments/manage-departments.component'; 
import { ManageSchedulesComponent } from '../manage-schedules/manage-schedules.component'; 
import { ManagePunchesComponent } from '../manage-punches/manage-punches.component'; 
import { ManageLeavesComponent } from '../manage-leaves/manage-leaves.component'; 
import { ManageTasksComponent } from '../manage-tasks/manage-tasks.component'; 
import { ManagePoliciesComponent } from '../manage-policies/manage-policies.component'; 

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: AdminLayoutComponent,
        data: { roles: ['admin'] },
        children: [
          { path: '', redirectTo: 'employees', pathMatch: 'full' },
          { path: 'employees',   component: ManageEmployeesComponent },
          { path: 'managers',    component: ManageManagersComponent },
          { path: 'departments', component: ManageDepartmentsComponent },
          { path: 'schedules',   component: ManageSchedulesComponent },
          { path: 'punches',     component: ManagePunchesComponent },
          { path: 'leaves',      component: ManageLeavesComponent },
          { path: 'tasks',       component: ManageTasksComponent },
          { path: 'policies',    component: ManagePoliciesComponent }
        ]
      }
    ])
  ]
})
export class AdminModule {}
