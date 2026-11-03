
import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function DropdownMenu({ label, icon: Icon, items = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full px-3 py-2.5 text-sm text-stone-700 hover:bg-[#f3e6d8]"
      >
        {Icon && <Icon size={18} />}
        {label}
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <button
            aria-label="Close dropdown"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
            {items.map((item) => {
              const ItemIcon = item.icon

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-700 hover:bg-[#faf3eb]"
                >
                  {ItemIcon && <ItemIcon size={17} />}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
