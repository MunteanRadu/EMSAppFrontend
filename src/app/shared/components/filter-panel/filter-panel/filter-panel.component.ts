import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterConfig } from '../../../models/filter-config';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent implements OnInit {
  @Input() config: FilterConfig[] = [];
  @Output() filterChange = new EventEmitter<Record<string, any>>();

  filterValues: Record<string, any> = {};

  ngOnInit() {
    this.config.forEach(field => {
      this.filterValues[field.name] = '';
    });
  }

  applyFilters() {
    this.filterChange.emit(this.filterValues);
  }

  clearFilters() {
    Object.keys(this.filterValues).forEach(key => {
      this.filterValues[key] = '';
    });
    this.filterChange.emit(this.filterValues);
  }
}