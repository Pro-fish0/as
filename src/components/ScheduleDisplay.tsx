import React from 'react';
import { EmployeeSchedule, getShiftHours } from '../types/schedule';

interface ScheduleDisplayProps {
  schedules: EmployeeSchedule[];
}

export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedules }) => {
  const TARGET_HOURS = 192;

  const calculateTotalHours = (schedule: EmployeeSchedule): number => {
    return schedule.schedules.reduce((total: number, day) => {
      if (day.isVacation) {
        if (day.originalHours && day.originalHours > 0) {
          return total - (day.hoursDifference || 0);
        } else {
          return total + 8;
        }
      }
      return total + getShiftHours(day.shift);
    }, 0);
  };

  const calculateHoursDifference = (totalHours: number): { missing: number; overtime: number } => {
    if (totalHours < TARGET_HOURS) {
      return { missing: TARGET_HOURS - totalHours, overtime: 0 };
    } else {
      return { missing: 0, overtime: totalHours - TARGET_HOURS };
    }
  };

  return (
    <div className="schedule-display-wrapper">
      <div className="schedule-display">
        <div className="schedule-header">
          <div className="fixed-columns">
            <div className="header-cell">#</div>
            <div className="header-cell">ID</div>
            <div className="header-cell">Name</div>
            <div className="header-cell">Team</div>
          </div>
          <div className="dates-header">
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="header-cell">{i + 1}</div>
            ))}
          </div>
          <div className="schedule-stats-header">
            <div className="header-cell">Total Hours</div>
            <div className="header-cell">Missing</div>
            <div className="header-cell">Overtime</div>
          </div>
        </div>

        <div className="schedule-rows">
          {schedules.map((schedule, index) => {
            const totalHours = calculateTotalHours(schedule);
            const { missing, overtime } = calculateHoursDifference(totalHours);
            return (
              <div key={schedule.employee.id} className="employee-row">
                <div className="fixed-columns">
                  <div className="cell">{index + 1}</div>
                  <div className="cell">{schedule.employee.employeeNumber}</div>
                  <div className="cell employee-name">{schedule.employee.name}</div>
                  <div className="cell">{schedule.employee.level}</div>
                </div>
                <div className="shifts">
                  {schedule.schedules.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`cell ${
                        day.isVacation ? 
                          (day.originalHours && day.originalHours > 0 ? 'vacation-shift' : 'vacation') :
                        day.isOffDay ? 'off-day' : 'shift'
                      }`}
                    >
                      {day.shift || '-'}
                      {day.isVacation && day.originalHours && day.originalHours > 0 && day.hoursDifference && day.hoursDifference > 0 && (
                        <span className="hours-diff">(-{day.hoursDifference}h)</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="schedule-stats">
                  <div className="cell total-hours">{totalHours}</div>
                  <div className={`cell ${missing > 0 ? 'warning' : ''}`}>
                    {missing > 0 ? `${missing}h` : '-'}
                  </div>
                  <div className={`cell ${overtime > 0 ? 'overtime' : ''}`}>
                    {overtime > 0 ? `${overtime}h` : '-'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 