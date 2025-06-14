import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScheduleRoutingModule } from './schedule-routing.module';
import { SchedulesComponent } from './schedule/schedule.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ScheduleRoutingModule,
    SchedulesComponent
  ]
})
export class ScheduleModule { }
