import type { MyScheduleResponse } from '@/types/schedules';
import { apiRequest } from '@/utils/api';

export const scheduleService = {
  async getMySchedule(date: string): Promise<MyScheduleResponse[]> {
    return apiRequest<unknown, MyScheduleResponse[]>(
      `schedule/my-schedule?date=${date}`,
      { method: 'GET' },
      true,
      true
    );
  },
};
