export type ShiftType = 'D8' | 'D10' | 'D11' | 'D12' | 'N8' | 'N10' | 'N11' | 'N12' | 'LN10' | 'LN11' | 'V' | 'C' | '';

export interface Employee {
  id: string;
  name: string;
  position: string;
  level: string;
  employeeNumber: string;
}

export interface ScheduleEntry {
  shift: ShiftType;
  date: string;
  isOffDay: boolean;
  isVacation?: boolean;
  originalHours?: number;
  hoursDifference?: number;
}

export interface EmployeeSchedule {
  employee: Employee;
  schedules: ScheduleEntry[];
  totalHours: number;
}

export interface MonthlySchedule {
  month: string; // Format: "YYYY-MM"
  schedules: EmployeeSchedule[];
}

export interface VacationEntry {
  employeeId: string;
  employeeName: string;
  startDate: string;  // YYYY-MM-DD format
  endDate: string;    // YYYY-MM-DD format
  type: string;
}

export const getShiftHours = (shift: ShiftType): number => {
  if (!shift) return 0;
  if (shift === 'C') return 8;
  if (shift === 'V') return 8;
  if (shift.includes('8')) return 8;
  if (shift.includes('10')) return 10;
  if (shift.includes('11')) return 11;
  if (shift.includes('12')) return 12;
  return 0;
};

export const isOffDay = (entry: string): boolean => {
  return entry === '\t' || entry.trim() === '';
};

export const parseShiftType = (value: string): ShiftType => {
  if (isOffDay(value)) return '';
  return value as ShiftType;
};

export const countVacationDays = (schedules: ScheduleEntry[]): number => {
  return schedules.filter(entry => entry.shift === 'V').length;
};

export const parseVacationInput = (input: string): VacationEntry[] => {
  const lines = input.split('\n');
  const vacations: VacationEntry[] = [];
  
  for (let i = 0; i < lines.length; i += 7) {
    if (i + 6 >= lines.length) break;
    
    const type = lines[i].trim();
    const employeeId = lines[i + 1].trim();
    const employeeName = lines[i + 2].trim();
    const startDate = lines[i + 4].trim(); // Format: YYYY/MM/DD
    const endDate = lines[i + 6].trim();   // Format: YYYY/MM/DD

    if (employeeId && startDate && endDate) {
      const formattedStartDate = startDate.replace(/\//g, '-');
      const formattedEndDate = endDate.replace(/\//g, '-');
      
      vacations.push({
        type,
        employeeId,
        employeeName,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
    }
  }
  
  return vacations;
};

export const adjustScheduleForVacation = (
  schedule: EmployeeSchedule,
  vacations: VacationEntry[],
  selectedMonth: string
): EmployeeSchedule => {
  const employeeVacations = vacations.filter(v => v.employeeId === schedule.employee.employeeNumber);
  
  if (employeeVacations.length === 0) return schedule;

  const [year, month] = selectedMonth.split('-');
  
  const updatedSchedules = schedule.schedules.map(entry => {
    const entryDate = new Date(entry.date);
    
    for (const vacation of employeeVacations) {
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      if (entryDate >= startDate && 
          entryDate <= endDate && 
          entryDate.getFullYear() === parseInt(year) &&
          entryDate.getMonth() + 1 === parseInt(month)) {
        
        const originalHours = getShiftHours(entry.shift);
        const vacationHours = 8;
        
        return {
          ...entry,
          isVacation: true,
          originalHours: originalHours,
          shift: 'V' as ShiftType,
          hoursDifference: originalHours > 0 ? originalHours - vacationHours : 0
        };
      }
    }
    
    return entry;
  });

  const totalHours = updatedSchedules.reduce((total, entry) => {
    if (entry.isVacation) {
      if (entry.originalHours && entry.originalHours > 0) {
        // If replacing a shift, subtract the difference from total
        return total - (entry.hoursDifference || 0);
      } else {
        // If it's an off day, add 8 hours
        return total + 8;
      }
    }
    return total + getShiftHours(entry.shift);
  }, 0);

  return {
    ...schedule,
    schedules: updatedSchedules,
    totalHours
  };
}; 