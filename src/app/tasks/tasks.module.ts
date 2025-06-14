import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TasksRoutingModule } from './tasks-routing.module';
import { TasksComponent } from './tasks/tasks.component';
import { MatDialogModule } from '@angular/material/dialog';
import { TaskDetailsDialogComponent } from './assignment-details-dialog/assignment-details-dialog.component'; 


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TasksRoutingModule,
    TasksComponent,
    MatDialogModule,
    TaskDetailsDialogComponent
  ]
})
export class TasksModule { }
