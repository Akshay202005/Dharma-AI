import React, { useEffect, useState } from 'react'
import { CgProfile } from "react-icons/cg";
import { RxHamburgerMenu } from 'react-icons/rx'
import { FiX } from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router';

const Nav = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Chat", path: "/chat" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className={`w-full h-20 flex items-center justify-between md:justify-center gap-7.5 p-5 fixed top-0 z-9999 overflow-visible 
      ${scrolled || menuOpen ? "bg-black/97" : "bg-transparent"}`}>
        <div className='w-full h-17.5 flex bg-transparent shadow-xl rounded-lg items-center gap-5 p-2 border-2 border-[#A87A22]'>

            <img src="/images/Logo.png" alt="Dharma AI Logo" className='w-12 h-12'/>

            <div className='w-full h-full flex items-center justify-end gap-5 p-2 bg-transparent'>
                {navLinks.map(({ label, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <div
                      key={path}
                      onClick={() => navigate(path)}
                      className={`hidden md:flex items-center gap-2 cursor-pointer relative float-end px-3 py-1 rounded-lg font-medium border-2 transition-colors duration-200
                        ${isActive
                          ? "border-[#A87A22] text-[#FFD76A]"
                          : "border-transparent text-white"
                        }`}
                    >
                      {label}
                    </div>
                  );
                })}

                <div
                  className='hidden md:flex items-center gap-2 cursor-pointer relative float-end px-3 py-1 rounded-lg font-medium'
                  onClick={() => navigate("/profile")}
                >
                  <CgProfile
                    size={25}
                    className={`transition-colors duration-200 ${
                      location.pathname === "/profile" ? "text-[#FFD76A]" : "text-white"
                    }`}
                  />
                </div>

                {/* Hamburger: phones only */}
                <button
                  type='button'
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  className='md:hidden cursor-pointer text-white p-1'
                >
                  {menuOpen ? <FiX size={26} /> : <RxHamburgerMenu size={26} />}
                </button>
            </div>
        </div>

        {/* Mobile dropdown menu: phones only */}
        {menuOpen && (
          <div className='md:hidden absolute top-full left-5 right-5 flex flex-col gap-1 p-3 bg-[#03060C] border-2 border-[#A87A22] rounded-lg shadow-xl'>
            {navLinks.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  type='button'
                  onClick={() => navigate(path)}
                  className={`cursor-pointer text-left px-3 py-2.5 rounded-lg font-medium border-2
                    ${isActive
                      ? "border-[#A87A22] text-[#FFD76A]"
                      : "border-transparent text-white hover:bg-white/10"
                    }`}
                >
                  {label}
                </button>
              );
            })}
            <button
              type='button'
              onClick={() => navigate("/profile")}
              className={`cursor-pointer flex items-center gap-2 text-left px-3 py-2.5 rounded-lg font-medium border-2
                ${location.pathname === "/profile"
                  ? "border-[#A87A22] text-[#FFD76A]"
                  : "border-transparent text-white hover:bg-white/10"
                }`}
            >
              <CgProfile size={22} />Profile
            </button>
          </div>
        )}
    </div>
  )
}

export default Nav