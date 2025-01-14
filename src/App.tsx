import { useState, useEffect } from 'react'
import './App.css'
import { 
  EmployeeSchedule, 
  MonthlySchedule,
  parseVacationInput,
  adjustScheduleForVacation
} from './types/schedule'
import { ScheduleInput } from './components/ScheduleInput'
import { ScheduleDisplay } from './components/ScheduleDisplay'

function App() {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([])
  const [showGrid, setShowGrid] = useState(false)
  const [showMissingHours, setShowMissingHours] = useState(false)
  const [searchEmployeeId, setSearchEmployeeId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [savedMonths, setSavedMonths] = useState<MonthlySchedule[]>([])
  const TARGET_HOURS = 192
  const [vacationInput, setVacationInput] = useState('');

  // Load saved schedules on mount
  useEffect(() => {
    const saved = localStorage.getItem('monthlySchedules')
    if (saved) {
      setSavedMonths(JSON.parse(saved))
    }
  }, [])

  // Save schedules when updated
  const saveSchedule = () => {
    if (!selectedMonth) return;
    
    const newMonthlySchedule: MonthlySchedule = {
      month: selectedMonth,
      schedules
    }

    const updatedMonths = savedMonths.filter(m => m.month !== selectedMonth)
    updatedMonths.push(newMonthlySchedule)
    
    setSavedMonths(updatedMonths)
    localStorage.setItem('monthlySchedules', JSON.stringify(updatedMonths))
  }

  const deleteMonth = (month: string) => {
    const updatedMonths = savedMonths.filter(m => m.month !== month)
    setSavedMonths(updatedMonths)
    localStorage.setItem('monthlySchedules', JSON.stringify(updatedMonths))
  }

  const loadMonth = (month: string) => {
    const monthData = savedMonths.find(m => m.month === month)
    if (monthData) {
      setSchedules(monthData.schedules)
      setSelectedMonth(month)
      setShowGrid(true)
    }
  }

  const handleScheduleImport = (newSchedules: EmployeeSchedule[]) => {
    setSchedules(newSchedules);
    saveSchedule(); // Save immediately after import
    setShowGrid(true); // Show grid view after import
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = searchEmployeeId ? 
      schedule.employee.employeeNumber.includes(searchEmployeeId) : true;
    const matchesMissingHours = showMissingHours ? 
      schedule.totalHours < TARGET_HOURS : true;
    return matchesSearch && matchesMissingHours;
  });

  const handleVacationUpdate = () => {
    if (!vacationInput.trim() || !selectedMonth) {
      alert('Please select a month and enter vacation data');
      return;
    }

    console.log('Processing vacation input...'); // Debug log
    
    const newVacations = parseVacationInput(vacationInput);
    console.log('Parsed vacations:', newVacations); // Debug log
    
    if (newVacations.length === 0) {
      alert('No valid vacation entries found. Please check the input format.');
      return;
    }

    // Update schedules with vacation data
    const updatedSchedules = schedules.map(schedule => {
      const updated = adjustScheduleForVacation(schedule, newVacations, selectedMonth);
      console.log(`Updated schedule for ${schedule.employee.employeeNumber}:`, updated); // Debug log
      return updated;
    });
    
    // Update state with new schedules
    setSchedules(updatedSchedules);
    
    // Update storage
    const newMonthlySchedule: MonthlySchedule = {
      month: selectedMonth,
      schedules: updatedSchedules
    };
    
    const updatedMonths = savedMonths.filter(m => m.month !== selectedMonth);
    updatedMonths.push(newMonthlySchedule);
    
    setSavedMonths(updatedMonths);
    localStorage.setItem('monthlySchedules', JSON.stringify(updatedMonths));

    // Clear the vacation input after successful update
    setVacationInput('');
    alert('Vacations updated successfully!');
  };

  const ImportView = () => (
    <div className="import-container">
      <h2>Import Schedule Data</h2>
      <div className="month-selector">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          required
        />
      </div>
      <ScheduleInput 
        onScheduleImport={handleScheduleImport} 
        selectedMonth={selectedMonth} 
      />
      {savedMonths.length > 0 && (
        <div className="saved-months">
          <h3>Saved Schedules</h3>
          <div className="months-list">
            {savedMonths.map(month => (
              <div key={month.month} className="month-item">
                <span>{month.month}</span>
                <div className="month-actions">
                  <button onClick={() => loadMonth(month.month)}>Load</button>
                  <button 
                    className="delete-button"
                    onClick={() => deleteMonth(month.month)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const GridView = () => (
    <div className="grid-container">
      <div className="grid-header">
        <h1>Monthly Schedule - {selectedMonth}</h1>
        <div className="filter-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Employee ID"
              value={searchEmployeeId}
              onChange={(e) => setSearchEmployeeId(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-option">
            <label>
              <input
                type="checkbox"
                checked={showMissingHours}
                onChange={(e) => setShowMissingHours(e.target.checked)}
              />
              Show Only Missing Hours
            </label>
          </div>
          <button className="back-button" onClick={() => setShowGrid(false)}>
            Back to Import
          </button>
        </div>
      </div>

      <ScheduleDisplay schedules={filteredSchedules} />

      <div className="vacation-update-section">
        <h3>Update Vacations</h3>
        <textarea
          className="vacation-input"
          placeholder="Paste vacation data here..."
          value={vacationInput}
          onChange={(e) => setVacationInput(e.target.value)}
          rows={10}
        />
        <button 
          className="update-button"
          onClick={handleVacationUpdate}
          disabled={!vacationInput.trim() || !selectedMonth}
        >
          Update Vacations
        </button>
      </div>
    </div>
  )

  return (
    <div className="app-container">
      {!showGrid ? <ImportView /> : <GridView />}
    </div>
  )
}

export default App 