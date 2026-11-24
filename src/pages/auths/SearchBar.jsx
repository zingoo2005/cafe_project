
import { Search, X } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar({
  value,
  onSearch,
  placeholder = 'Search cafes...',
}) {
  const [query, setQuery] = useState(value || '')

  function submit(event) {
    event.preventDefault()
    onSearch?.(query.trim())
  }

  function clear() {
    setQuery('')
    onSearch?.('')
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex items-center gap-2 rounded-full border border-stone-200 bg-[#f5f0eb] px-4 py-3"
    >
      <Search size={18} className="shrink-0 text-stone-500" />

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Search cafes"
        className="w-full min-w-0 bg-transparent text-sm outline-none"
      />

      {query && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="text-stone-500 hover:text-stone-900"
        >
          <X size={17} />
        </button>
      )}

      <button
        type="submit"
        className="rounded-full bg-[#68452f] px-4 py-2 text-sm font-bold text-white hover:bg-[#493024]"
      >
        Search
      </button>
    </form>
  )
}
