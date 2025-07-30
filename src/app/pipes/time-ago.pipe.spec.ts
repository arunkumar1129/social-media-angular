import { TestBed } from '@angular/core/testing';
import { TimeAgoPipe } from './time-ago.pipe';
import { TimeUtilsService } from '../services/time-utils.service';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;
  let timeUtilsService: jasmine.SpyObj<TimeUtilsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('TimeUtilsService', ['getTimeAgo']);

    TestBed.configureTestingModule({
      providers: [
        TimeAgoPipe,
        { provide: TimeUtilsService, useValue: spy }
      ]
    });

    pipe = TestBed.inject(TimeAgoPipe);
    timeUtilsService = TestBed.inject(TimeUtilsService) as jasmine.SpyObj<TimeUtilsService>;
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null value', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
    expect(timeUtilsService.getTimeAgo).not.toHaveBeenCalled();
  });

  it('should return empty string for undefined value', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
    expect(timeUtilsService.getTimeAgo).not.toHaveBeenCalled();
  });

  it('should call timeUtils.getTimeAgo with date value', () => {
    const testDate = new Date('2025-07-30T10:00:00Z');
    timeUtilsService.getTimeAgo.and.returnValue('2 hours ago');

    const result = pipe.transform(testDate);

    expect(timeUtilsService.getTimeAgo).toHaveBeenCalledWith(testDate);
    expect(result).toBe('2 hours ago');
  });

  it('should call timeUtils.getTimeAgo with string value', () => {
    const testDateString = '2025-07-30T10:00:00Z';
    timeUtilsService.getTimeAgo.and.returnValue('2 hours ago');

    const result = pipe.transform(testDateString);

    expect(timeUtilsService.getTimeAgo).toHaveBeenCalledWith(testDateString);
    expect(result).toBe('2 hours ago');
  });
});
