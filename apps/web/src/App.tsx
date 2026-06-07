import { useState } from 'react'
import CountdownPanel from './components/CountdownPanel'
import HolidayList from './components/HolidayList'
import PlanResult from './components/PlanResult'
import PlannerForm from './components/PlannerForm'
import { useLeavePlanner } from './hooks/useLeavePlanner'
import {
  exportProfile,
  importProfileFromFile,
  saveProfile,
} from './lib/storage'
import './styles/global.css'

export default function App() {
  const planner = useLeavePlanner()
  const [importError, setImportError] = useState<string | null>(null)

  const handleExport = () => {
    exportProfile({
      consecutiveDays: planner.consecutiveDays,
      selectedPlanId: planner.selectedPlan?.id ?? null,
      customOffDays: [],
    })
  }

  const handleImport = async (file: File) => {
    try {
      const profile = await importProfileFromFile(file)
      saveProfile(profile)
      setImportError(null)
      window.location.reload()
    } catch {
      setImportError('Could not read profile file.')
    }
  }

  return (
    <div className="app-shell">
      <div className="app">
        <header className="app-header">
          <p className="app-header-eyebrow">Long weekends · public holidays · less leave</p>
          <h1 className="app-header-title">
            <span className="app-header-emoji" aria-hidden="true">
              🏖️
            </span>
            NZ Leave Planner
          </h1>
          <p className="app-header-tagline">
            Find the sweetest stretch of days off — weekends and national holidays do the heavy
            lifting so you keep more annual leave in the bank.
          </p>
        </header>

        <CountdownPanel
          today={planner.today}
          nextBreak={planner.nextBreak}
          breakCountdownDays={planner.breakCountdownDays}
          nextPublicHoliday={planner.nextPublicHoliday}
          publicHolidayCountdownDays={planner.publicHolidayCountdownDays}
        />

        <PlannerForm
          consecutiveDays={planner.consecutiveDays}
          minDays={planner.minDays}
          maxDays={planner.maxDays}
          onDaysChange={planner.handleDaysChange}
          onExport={handleExport}
          onImport={handleImport}
        />

        {importError && <p className="error">{importError}</p>}

        <PlanResult
          today={planner.today}
          consecutiveDays={planner.consecutiveDays}
          bestPlans={planner.bestPlans}
          soonestPlans={planner.soonestPlans}
          anchoredPublicHolidayPlans={planner.anchoredPublicHolidayPlans}
          selectedPlan={planner.selectedPlan}
          years={planner.years}
          onSelectPlan={planner.handleSelectPlan}
        />

        <HolidayList results={planner.holidayResults} />
      </div>
    </div>
  )
}
