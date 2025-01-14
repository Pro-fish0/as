import React, { useState } from 'react';
import { TextField, Button, Box, Paper } from '@mui/material';
import Papa from 'papaparse';
import { EmployeeSchedule, parseShiftType, isOffDay, getShiftHours } from '../types/schedule';

interface ScheduleInputProps {
  onScheduleImport: (schedules: EmployeeSchedule[]) => void;
  selectedMonth: string;
}

export const ScheduleInput: React.FC<ScheduleInputProps> = ({ onScheduleImport, selectedMonth }) => {
  const [inputText, setInputText] = useState('');

  const parseScheduleText = (text: string) => {
    const rows = text.trim().split('\n');
    const schedules: EmployeeSchedule[] = [];

    rows.forEach((row) => {
      const columns = row.split('\t').map(col => col.trim());
      if (columns.length >= 5) {
        const scheduleEntries = columns.slice(0, -5).map((shift, index) => ({
          shift: parseShiftType(shift),
          date: `${selectedMonth}-${(index + 1).toString().padStart(2, '0')}`,
          isOffDay: isOffDay(shift)
        }));

        const workingHours = scheduleEntries.reduce((total, entry) => {
          return total + getShiftHours(entry.shift);
        }, 0);

        const employeeSchedule: EmployeeSchedule = {
          employee: {
            id: columns[columns.length - 2],
            name: columns[columns.length - 3],
            position: columns[columns.length - 4],
            level: columns[columns.length - 5],
            employeeNumber: columns[columns.length - 2]
          },
          schedules: scheduleEntries,
          workingHours,
          requiredHours: 192,  // Initial required hours before vacation adjustments
          overtime: workingHours - 192  // Initial overtime calculation
        };

        schedules.push(employeeSchedule);
      }
    });

    return schedules;
  };

  const handleTextInput = () => {
    const schedules = parseScheduleText(inputText);
    onScheduleImport(schedules);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<string[]>(file, {
        complete: (results) => {
          setInputText(results.data.map(row => row.join('\t')).join('\n'));
        }
      });
    }
  };

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          multiline
          rows={10}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste schedule data here..."
          variant="outlined"
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            component="label"
          >
            Upload CSV
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleFileUpload}
            />
          </Button>
          <Button
            variant="contained"
            onClick={handleTextInput}
            disabled={!inputText || !selectedMonth}
          >
            Process Schedule
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}; 