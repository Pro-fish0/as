import React from 'react';
import { EmployeeSchedule } from '../types/schedule';

interface ScheduleDisplayProps {
  schedules: EmployeeSchedule[];
}

export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedules }) => {
  // Create array of dates from 1 to 31
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="schedule-display-wrapper">
      <div className="schedule-display">
        <div className="schedule-header">
          <div className="fixed-columns">
            <div className="header-cell">#</div>
            <div className="header-cell">ID</div>
            <div className="header-cell">Name</div>
          </div>
          <div className="dates-header">
            {dates.map((date) => (
              <div key={date} className="header-cell">{date}</div>
            ))}
          </div>
          <div className="schedule-stats-header">
            <div className="header-cell">Working Hours</div>
            <div className="header-cell">Required Hours</div>
            <div className="header-cell">+/-</div>
          </div>
        </div>
        <div className="schedule-body">
          {schedules.map((schedule, index) => (
            <div key={schedule.employee.id} className="schedule-row">
              <div className="fixed-columns">
                <div className="cell">{index + 1}</div>
                <div className="cell">{schedule.employee.employeeNumber}</div>
                <div className="cell employee-name">{schedule.employee.name}</div>
              </div>
              <div className="dates-content">
                {schedule.schedules.map((day, dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className={`cell ${day.isVacation ? 'vacation' : ''} ${!day.shift ? 'off-day' : 'shift'}`}
                  >
                    {day.shift}
                  </div>
                ))}
              </div>
              <div className="schedule-stats">
                <div className="cell">{schedule.workingHours}</div>
                <div className="cell">{schedule.requiredHours}</div>
                <div className={`cell ${schedule.overtime >= 0 ? 'positive' : 'negative'}`}>
                  {schedule.overtime >= 0 ? '+' : ''}{schedule.overtime}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 