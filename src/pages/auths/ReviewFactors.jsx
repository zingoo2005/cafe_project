
import { useState } from 'react'

const reviewFactors = {
  Study: [
    'Quiet and peaceful environment',
    'Fast and reliable Wi-Fi',
    'Accessible power outlets',
    'Comfortable chairs and spacious tables',
    'Affordable food and beverages',
  ],
  Work: [
    'Fast and stable internet connection',
    'Convenient power outlets',
    'Comfortable workstations',
    'Quiet environment for concentration',
    'Meeting spaces for business discussions',
  ],
  Dating: [
    'Attractive interior design',
    'Romantic atmosphere and warm lighting',
    'Beautiful photo spots',
    'Private and comfortable seating',
    'Delicious coffee and desserts',
  ],
  Relaxation: [
    'Calm and peaceful atmosphere',
    'Comfortable sofas and chairs',
    'Relaxing background music',
    'Natural lighting and indoor plants',
    'Pleasant views',
  ],
  'Meeting Friends': [
    'Spacious tables for groups',
    'Comfortable environment for conversation',
    'Variety of food and beverages',
    'Affordable prices and group promotions',
    'Convenient location and parking facilities',
  ],
}

export default function ReviewFactors() {
  const [purpose, setPurpose] = useState('Study')
  const [selected, setSelected] = useState([])

  function toggleFactor(factor) {
    setSelected((current) =>
      current.includes(factor)
        ? current.filter((item) => item !== factor)
        : [...current, factor]
    )
  }

  async function copyAnswers() {
    if (selected.length === 0) {
      alert('Please select at least one attraction factor.')
      return
    }

    const answers = [
      `Purpose: ${purpose}`,
      'Attraction Factors:',
      ...selected.map((factor) => `- ${factor}`),
    ].join('\n')

    try {
      await navigator.clipboard.writeText(answers)
      alert('Review answers copied!')
    } catch {
      window.prompt('Copy your selected answers:', answers)
    }
  }

  return (
    <section className="rounded-2xl border border-coffee-100 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-extrabold text-coffee-900">
        Café Customer Review
      </h2>

      <p className="mt-2 text-sm text-stone-500">
        What attracts you to this café?
        Select all factors that apply.
      </p>

      <label
        htmlFor="visit-purpose"
        className="mt-5 block text-sm font-bold text-stone-700"
      >
        Visit Purpose
      </label>

      <select
        id="visit-purpose"
        value={purpose}
        onChange={(event) => {
          setPurpose(event.target.value)
          setSelected([])
        }}
        className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm"
      >
        {Object.keys(reviewFactors).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <div className="mt-6">
        <h3 className="mb-4 text-sm font-bold text-stone-800">
          Attraction Factors
        </h3>

        <div className="space-y-4">
          {reviewFactors[purpose].map((factor) => (
            <label
              key={factor}
              className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-stone-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(factor)}
                onChange={() => toggleFactor(factor)}
                className="mt-1 h-4 w-4 shrink-0 accent-stone-900"
              />
              <span>{factor}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="mt-5 text-xs text-stone-500">
        {selected.length} factor(s) selected
      </p>

      <button
        type="button"
        onClick={copyAnswers}
        className="mt-4 w-full rounded-xl bg-coffee-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-coffee-900"
      >
        save answers
      </button>
    </section>
  )
}
