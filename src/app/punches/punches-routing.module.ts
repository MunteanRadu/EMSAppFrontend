import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PunchesComponent }     from './punches/punches.component';

const routes: Routes = [
  { path: '', component: PunchesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PunchesRoutingModule {}
