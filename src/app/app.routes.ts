// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { ManageEmployeesComponent } from './employees/manage-employees/manage-employees.component';
import { ManageDepartmentsComponent } from './employees/manage-department/manage-department.component';
import { DepartmentGuard } from './auth/guards/department.guard';
import { PendingAssignmentComponent } from './auth/department/pending-assignment/pending-assignment.component';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
import { StaffGuard } from './auth/guards/staff.guard';
import { ManagerGuard } from './auth/guards/manager.guard';
import { AdminGuard } from './auth/guards/admin.guard';
import { SchedulesComponent } from './schedules/schedule/schedule.component';

export const appRoutes: Routes = [
  // standalone login component
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { 
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent),
    data: { showHeader: false } // no header on login page
  },

  {
    path: 'register',
    loadComponent: () =>
        import('./auth/register/register.component').then(m => m.RegisterComponent),
    data: { showHeader: false } // no header on register page
  },

  // lazy-load the DashboardModule
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard, DepartmentGuard, StaffGuard],
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard, DepartmentGuard, StaffGuard],
  },
  {
    path: 'punches',
    loadChildren: () =>
      import('./punches/punches.module').then(m => m.PunchesModule),
    canActivate: [AuthGuard, DepartmentGuard, StaffGuard],
  },
  {
    path: 'schedules',
    component: SchedulesComponent,
    canActivate: [AuthGuard, DepartmentGuard]
  },
  {
    path: 'leaves',
    loadChildren: () =>
      import('./leaves/leaves.module').then(m => m.LeavesModule),
    canActivate: [AuthGuard, DepartmentGuard, StaffGuard],
  },
  {
    path: 'tasks',
    loadChildren: () =>
      import('./tasks/tasks.module').then(m => m.TasksModule),
    canActivate: [AuthGuard, DepartmentGuard, StaffGuard],
  },
  {
    path: 'employees',
    component: ManageEmployeesComponent,
    canActivate: [AuthGuard, ManagerGuard],
  },
  {
    path: 'department/manage',
    component: ManageDepartmentsComponent,
    canActivate: [AuthGuard, ManagerGuard],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, AdminGuard],
  },

  {
    path: 'pending-assignment',
    component: PendingAssignmentComponent,
    data: { showHeader: false }
  },

  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    data: { showHeader: false }
  },

  // catch-all → redirect
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
