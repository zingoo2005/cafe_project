import { useEffect, useMemo, useState } from 'react'
import { getCafeReviewOptions, reviewApi } from '../api/cafes'

export function CafeReviewTags({ review }) {
  const tags = [
    ...(review?.purpose_tags || []).map((purpose) => purpose.name),
    ...(review?.attraction_factors || []).map((factor) => factor.name),
    ...(review?.custom_factors || []).map((factor) => factor.name),
  ]

  if (tags.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-coffee-700">
          {tag}
        </span>
      ))}
    </div>
  )
}

export default function CafeReviewForm({ cafeId, review, onSaved, onDeleted }) {
  const [options, setOptions] = useState([])
  const [optionsError, setOptionsError] = useState('')
  const [rating, setRating] = useState(review?.rating || 5)
  const [body, setBody] = useState(review?.body || '')
  const [purposeIds, setPurposeIds] = useState((review?.purpose_tags || []).map(({ id }) => id))
  const [factorIds, setFactorIds] = useState((review?.attraction_factors || []).map(({ id }) => id))
  const [customFactors, setCustomFactors] = useState((review?.custom_factors || []).map(({ name }) => name))
  const [customFactorInput, setCustomFactorInput] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getCafeReviewOptions()
      .then((response) => {
        if (active) setOptions(response.data || [])
      })
      .catch((requestError) => {
        if (active) setOptionsError(requestError.message || 'Unable to load review purposes.')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setRating(review?.rating || 5)
    setBody(review?.body || '')
    setPurposeIds((review?.purpose_tags || []).map(({ id }) => id))
    setFactorIds((review?.attraction_factors || []).map(({ id }) => id))
    setCustomFactors((review?.custom_factors || []).map(({ name }) => name))
    setError('')
    setNotice('')
  }, [review])

  const availableFactors = useMemo(
    () => options
      .filter((purpose) => purposeIds.includes(purpose.id))
      .flatMap((purpose) => purpose.attraction_factors || []),
    [options, purposeIds]
  )

  function togglePurpose(id) {
    setPurposeIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
      const nextFactors = options
        .filter((purpose) => next.includes(purpose.id))
        .flatMap((purpose) => purpose.attraction_factors || [])
        .map((factor) => factor.id)
      setFactorIds((selected) => selected.filter((factorId) => nextFactors.includes(factorId)))
      return next
    })
  }

  function addCustomFactor() {
    const name = customFactorInput.trim()
    if (!name || customFactors.some((factor) => factor.toLocaleLowerCase() === name.toLocaleLowerCase())) return
    setCustomFactors((current) => [...current, name])
    setCustomFactorInput('')
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (purposeIds.length === 0) {
      setError('Select at least one purpose.')
      return
    }
    if (factorIds.length === 0 && customFactors.length === 0) {
      setError('Select or add at least one attraction factor.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        rating,
        body,
        purpose_ids: purposeIds,
        attraction_factor_ids: factorIds,
        custom_factors: customFactors,
      }
      const response = review
        ? await reviewApi.update(cafeId, payload)
        : await reviewApi.create(cafeId, payload)
      await onSaved?.(response.data)
      setNotice(review ? 'Review updated.' : 'Review submitted.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to save your review.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!review || !window.confirm('Delete your café review?')) return
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await reviewApi.remove(review.id)
      await onDeleted?.()
      setNotice('Review deleted.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete your review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <label className="text-sm font-bold text-stone-700">Your rating
        <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="ml-3 rounded-lg border p-2">
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-bold text-stone-700">Purpose tags <span className="font-normal text-stone-500">Select one or more</span></legend>
        {optionsError && <p role="alert" className="mt-2 text-sm text-red-600">{optionsError}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((purpose) => (
            <label key={purpose.id} className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${purposeIds.includes(purpose.id) ? 'border-coffee-700 bg-coffee-700 text-white' : 'border-coffee-200 text-coffee-800'}`}>
              <input className="sr-only" type="checkbox" checked={purposeIds.includes(purpose.id)} onChange={() => togglePurpose(purpose.id)} />
              {purpose.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-bold text-stone-700">Attraction factors</legend>
        {purposeIds.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Choose a purpose to see matching café features.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {availableFactors.map((factor) => (
              <label key={factor.id} className="flex items-start gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={factorIds.includes(factor.id)} onChange={() => setFactorIds((current) => current.includes(factor.id) ? current.filter((id) => id !== factor.id) : [...current, factor.id])} />
                {factor.name}
              </label>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={customFactorInput} onChange={(event) => setCustomFactorInput(event.target.value)} maxLength={100} className="min-w-0 flex-1 rounded-xl border p-3 text-sm" placeholder="Add a custom factor" />
          <button type="button" onClick={addCustomFactor} className="rounded-xl border px-4 py-2 text-sm font-bold text-coffee-700">Add factor</button>
        </div>
        {customFactors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {customFactors.map((factor) => (
              <button key={factor} type="button" onClick={() => setCustomFactors((current) => current.filter((item) => item !== factor))} className="rounded-full bg-coffee-50 px-3 py-1 text-xs font-semibold text-coffee-700">
                {factor} ×
              </button>
            ))}
          </div>
        )}
      </fieldset>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={5000} rows={3} className="w-full rounded-xl border p-3" placeholder="Share your experience (optional)" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={saving || Boolean(optionsError)} className="rounded-xl bg-coffee-700 px-5 py-3 font-bold text-white disabled:opacity-50">
          {saving ? 'Saving...' : review ? 'Update review' : 'Submit review'}
        </button>
        {review && <button type="button" disabled={saving} onClick={remove} className="rounded-xl border border-red-200 px-5 py-3 font-bold text-red-600 disabled:opacity-50">Delete my review</button>}
      </div>
    </form>
  )
}
