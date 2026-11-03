
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Logout({ onLogout }) {
  const navigate = useNavigate()

  function handleLogout() {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.removeItem('cafemate-session')
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#FBF6F1] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#E8DED5] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FBF6F1] text-[#6F4E3A]">
          <LogOut size={26} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-[#593722]">
          Log out of CafeMate?
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#8B7B70]">
          You can sign back in whenever you are ready.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-[#E8DED5] px-4 py-3 font-bold text-[#6F4E3A] transition hover:bg-[#FBF6F1]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-[#6F4E3A] px-4 py-3 font-bold text-white transition hover:bg-[#593722]"
          >
            Log Out
          </button>
        </div>
      </section>
    </main>
  )
}
