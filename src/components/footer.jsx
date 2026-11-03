import { Coffee, MessageCircle, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return <footer className="mt-18 bg-coffee-900 text-white">
    <div className="mx-auto grid w-[min(1180px,92%)] gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_0.8fr]">
      <div>
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold"><Coffee className="text-coffee-300" /> CafeMate Mandalay</Link>
        <p className="mt-4 max-w-sm text-sm leading-7 text-coffee-100">Discover cafés in Mandalay for a productive workday, a catch-up with friends, or your next great cup of coffee.</p>
      </div>
      <div>
        <h2 className="font-bold">Explore</h2>
        <div className="mt-4 flex flex-col items-start gap-3 text-sm text-coffee-100"><Link to="/">Discover cafés</Link><Link to="/favourites">Favourites</Link><Link to="/profile">My profile</Link></div>
      </div>
      <div>
        <h2 className="font-bold">Follow us</h2>
        <div className="mt-4 flex gap-3"><a href="https://www.facebook.com/" aria-label="Facebook" className="rounded-full bg-white/10 p-3 hover:bg-coffee-500"><MessageCircle size={18}/></a><a href="https://www.instagram.com/" aria-label="Instagram" className="rounded-full bg-white/10 p-3 hover:bg-coffee-500"><MessageCircle size={18}/></a><span className="rounded-full bg-white/10 p-3"><MapPin size={18}/></span></div>
      </div>
    </div>
    <div className="border-t border-white/10 py-5 text-center text-xs text-coffee-100">© {new Date().getFullYear()} CafeMate Mandalay. All rights reserved.</div>
  </footer>
}
