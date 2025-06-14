import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { PendingAssignmentComponent } from './department/pending-assignment/pending-assignment.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AuthRoutingModule,
    PendingAssignmentComponent
  ]
})
export class AuthModule { }
