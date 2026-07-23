/**
 * Navbar Only Layout
 * Layout with just the navbar, no footer - for full-screen-like pages
 */
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

const NavbarOnlyLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default NavbarOnlyLayout
