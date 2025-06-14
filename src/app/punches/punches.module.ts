import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import { PunchesRoutingModule } from './punches-routing.module';

import { PunchesComponent }    from './punches/punches.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, PunchesRoutingModule, PunchesComponent]
})
export class PunchesModule {}
