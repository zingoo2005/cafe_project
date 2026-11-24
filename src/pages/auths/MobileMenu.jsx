
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

export default function MobileMenu({ open, onClose, links = [] }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30 xl:hidden">
      <aside className="ml-auto flex h-full w-[min(340px,85%)] flex-col overflow-y-auto bg-[#fffdf9] p-5 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xl font-black text-[#553724]">
            CafeMate
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 hover:bg-stone-100"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-700 hover:bg-[#f3e6d8]"
              >
                {Icon && <Icon size={18} />}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <button
        type="button"
        aria-label="Close mobile menu"
        onClick={onClose}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </div>
  )
}
