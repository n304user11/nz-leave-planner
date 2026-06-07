type PlannerFormProps = {
  consecutiveDays: number
  minDays: number
  maxDays: number
  onDaysChange: (value: number) => void
  onExport: () => void
  onImport: (file: File) => void
}

export default function PlannerForm({
  consecutiveDays,
  minDays,
  maxDays,
  onDaysChange,
  onExport,
  onImport,
}: PlannerFormProps) {
  return (
    <section className="planner-form card-festive">
      <h2>How long is your break?</h2>
      <p className="hint">
        Pick consecutive calendar days — we&apos;ll weave in weekends and public holidays so you
        use as little annual leave as possible.
      </p>
      <label className="field">
        <span className="field-label">Days off in a row</span>
        <input
          className="control"
          type="number"
          min={minDays}
          max={maxDays}
          value={consecutiveDays}
          onChange={(e) => onDaysChange(Number(e.target.value))}
        />
      </label>
      <div className="button-row">
        <button type="button" className="btn btn-ghost" onClick={onExport}>
          Export JSON
        </button>
        <label className="file-button btn btn-ghost">
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </section>
  )
}
