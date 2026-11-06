import React from 'react'
import Nav from '../components/Nav'
import { motion, AnimatePresence  } from 'motion/react'
import { FaRegArrowAltCircleRight } from "react-icons/fa";
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux'


const Home = () => {

  const navigate = useNavigate();
  const { isAuthenticated, authChecked } = useSelector((state) => state.user)

  const handleTalkWithKrishna = () => {
    if (!authChecked) return                       // still checking login status, ignore the click
    navigate(isAuthenticated ? '/chat' : '/signin')
  }

  return (
    <div className='w-full min-h-screen bg-[url("/images/BG_Cosmic.png")] bg-cover bg-center bg-no-repeat flex flex-col items-center py-5 px-15'>
      
      <Nav />
      
      <div className="w-full max-w-3xl flex flex-col items-center justify-center ">

        {/* Dharma AI Logo */}

          <motion.img src="/images/Dharma-Ai.png" alt="Dharma AI" 
            className='w-auto h-70 items-center mx-auto -mt-8'
            initial={{ opacity: 0, y:120}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />

        {/* Tagline */}

          <motion.h2
            className='text-xl font-bold text-center text-white -mt-20'
            initial={{ opacity: 0, y:120}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            Ancient Wisdom. Modern AI. Meaningful Guidance.
          </motion.h2>

          <motion.p
            className='text-sm text-center text-white mt-1.25'
            initial={{ opacity: 0, y:120}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            Seek clarity. Reflect deeply. Grow with timeless wisdom.
          </motion.p>

          {/* Dharma AI Logo */}

          <motion.img src="/images/Krishna-Hero.png" alt="Dharma AI" 
            className='w-65 h-auto items-center mx-auto'
            initial={{ opacity: 0, y:120}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />

          <motion.button
            className='cursor-pointer flex bg-transparent border-2 border-[#A87A22] hover:bg-[#A87A22] hover:text-[#03060C] text-[#FFD76A] text-center font-bold py-2 px-4 rounded-4xl'
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
  
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.6,
            }}
            transition={{
              delay: 0.4,
              duration: 0.6,
              ease: "easeOut",
            }}

            onClick={handleTalkWithKrishna}
            disabled={!authChecked}
          >
            Talk with Krishna<FaRegArrowAltCircleRight size={25} className='ml-3 font-normal'/>
          </motion.button>

      </div>
    </div>
  )
}

export default Home
