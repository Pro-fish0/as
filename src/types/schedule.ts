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
  workingHours: number;    // Actual hours worked + vacation coverage
  requiredHours: number;   // 192 - (8 * number of vacation days on off days)
  overtime: number;        // workingHours - requiredHours
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
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  // Create a reversed copy of schedules for processing
  const reversedSchedules = [...schedule.schedules].reverse();
  
  const updatedSchedules = reversedSchedules.map((entry, index) => {
    // Adjust the date to match the reversed index
    const actualDate = new Date(`${selectedMonth}-${(31 - index).toString().padStart(2, '0')}`);
    
    // Only process if the entry date is in the selected month/year
    if (actualDate.getFullYear() !== yearNum || actualDate.getMonth() + 1 !== monthNum) {
      return entry;
    }

    for (const vacation of employeeVacations) {
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      if (actualDate >= startDate && actualDate <= endDate) {
        const originalHours = getShiftHours(entry.shift);
        const vacationHours = 8;
        
        // If it's an off day (no shift)
        if (entry.shift.length === 0) {
          return {
            ...entry,
            isVacation: true,
            originalHours: 0,
            shift: 'V' as ShiftType,
            hoursDifference: 0  // No impact on working hours since it's an off day
          };
        } else {
          // If replacing a shift, calculate uncovered hours
          const uncoveredHours = Math.max(0, originalHours - vacationHours);
          return {
            ...entry,
            isVacation: true,
            originalHours: originalHours,
            shift: 'V' as ShiftType,
            hoursDifference: uncoveredHours  // Hours that won't count towards working hours
          };
        }
      }
    }
    
    return entry;
  });

  // Count vacation days on off days to reduce required hours
  const vacationOnOffDays = updatedSchedules.filter(
    entry => entry.isVacation && (!entry.originalHours || entry.originalHours === 0)
  ).length;

  // Calculate working hours
  const workingHours = updatedSchedules.reduce((total, entry) => {
    if (entry.isVacation) {
      if (!entry.originalHours || entry.originalHours === 0) {
        // Vacation on off day: doesn't add to working hours
        return total;
      } else {
        // Vacation replacing shift: only count covered hours (8)
        return total + 8;
      }
    }
    // Regular shift: count all hours
    return total + getShiftHours(entry.shift);
  }, 0);

  // Calculate required hours (192 minus 8 hours for each vacation on off day)
  const requiredHours = 192 - (vacationOnOffDays * 8);
  
  // Calculate overtime (can be negative for missing hours)
  const overtime = workingHours - requiredHours;

  return {
    ...schedule,
    schedules: updatedSchedules,
    workingHours,
    requiredHours,
    overtime
  };
}; 