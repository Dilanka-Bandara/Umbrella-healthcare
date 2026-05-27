import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ShoppingCart, User, Menu } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Umbrella Health</span>
          </Link>

          {/* Desktop Search (Hidden on Mobile) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <input 
              type="text" 
              placeholder="Search for medicines, doctors..." 
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          {/* Icons Section */}
          <div className="flex items-center gap-6">
            <Link to="/cart" className="relative text-gray-600 hover:text-blue-600 transition">
              <ShoppingCart className="h-6 w-6" />
              {/* Notification Dot */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                0
              </span>
            </Link>
            
            <Link to="/login" className="hidden md:flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium">
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </Link>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-gray-600">
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;