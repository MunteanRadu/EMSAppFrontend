import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

export interface ColumnDef<T> {
  header: string;
  field: keyof T;
  type?: 'text' | 'date';
}

@Component({
  selector: 'app-filter-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-table.component.html',
  styleUrls: ['./filter-table.component.scss']
})
export class FilterTableComponent<T> {
  @Input() data: T[] = [];
  @Input() columns: ColumnDef<T>[] = [];

  // Projected <ng-template #headerCell>…</ng-template>
  @ContentChild('headerCell', { read: TemplateRef }) headerCellTpl?: TemplateRef<any>;

  // Projected <ng-template #rowTpl let-row>…</ng-template>
  @ContentChild('rowTpl', { read: TemplateRef }) rowTpl!: TemplateRef<any>;

  filterValues: Partial<Record<keyof T, string>> = {};

  get filteredData(): T[] {
    return this.data.filter(row =>
      this.columns.every(col => {
        const f = this.filterValues[col.field] || '';
        if (!f) return true;
        const cell = row[col.field];
        if (col.type === 'date') {
          return String(cell) === f;
        }
        return String(cell).toLowerCase().includes(f.toLowerCase());
      })
    );
  }
}
