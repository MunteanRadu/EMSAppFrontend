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
    // Initialize the filter values based on the configuration
    this.config.forEach(field => {
      this.filterValues[field.name] = '';
    });
  }

  applyFilters() {
    this.filterChange.emit(this.filterValues);
  }

  clearFilters() {
    // Reset all filter values
    Object.keys(this.filterValues).forEach(key => {
      this.filterValues[key] = '';
    });
    // Emit the cleared values to update the parent list
    this.filterChange.emit(this.filterValues);
  }
}