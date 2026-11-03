
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/footer'

export default function MainLayout({ favouriteCount = 0 }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar favouriteCount={favouriteCount} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
