import { Pipe, PipeTransform, inject } from '@angular/core';
import { TimeUtilsService } from '../services/time-utils.service';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false // Set to false to update automatically as time passes
})
export class TimeAgoPipe implements PipeTransform {
  private timeUtils = inject(TimeUtilsService);

  transform(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }

    return this.timeUtils.getTimeAgo(value);
  }
}
