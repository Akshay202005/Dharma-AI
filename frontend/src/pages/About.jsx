import React from 'react'
import Nav from '../components/Nav'

const About = () => {

  return (
    <div className='w-full min-h-screen bg-[url("/images/BG_Cosmic.png")] bg-cover bg-center bg-no-repeat flex flex-col items-center py-5 px-4 sm:px-8 lg:px-15'>

      <Nav />

      <div className='w-full h-full flex flex-col items-center justify-center gap-5 p-5 bg-[#03060C] border-2 border-[#6D6C6C] rounded-lg shadow-xl mt-20'>

        <h1 className='text-3xl sm:text-4xl font-bold text-[#ffffff] text-center'>
          About Dharma AI
        </h1>

        <p className='text-lg text-[#ffffff] text-center mt-2'>
          Bridging ancient wisdom and modern AI to support thoughtful decision-making and self-reflection.
        </p>

        <div className="mt-4 w-full flex flex-col gap-4 p-2 sm:p-5">
          <div className='text-[#ffffff] mt-4'>
            <h2 className='text-2xl font-bold pb-2'>What is Dharma AI?</h2>
            <p>
              Dharma AI is an AI-driven emotional guidance platform inspired by the timeless wisdom of the Bhagavad Gita and the stories of the Mahabharata. It provides a space where users can share their thoughts, emotions, and challenges while receiving AI-generated guidance inspired by the teachings, values, and experiences represented in these traditions.
            </p>
          </div>

          <div className='text-[#ffffff] mt-4'>
            <h2 className='text-2xl font-bold pb-2'>Our Mission</h2>
            <p>
              Our mission is to bridge ancient wisdom with modern artificial intelligence, helping people navigate fear, self-doubt, difficult decisions, stress, and everyday life challenges with greater clarity, perspective, and inner balance. Dharma AI encourages thoughtful reflection while making timeless wisdom more accessible in today's digital world.
            </p>
          </div>

          <div className='text-[#ffffff] mt-4'>
            <h2 className='text-2xl font-bold pb-2'>How It Works</h2>
            <p>
              <span className='text-lg font-bold'>1. Share Your Thoughts:</span>
                 Describe your situation, question, or challenge through a natural conversation.
              <span className='text-lg font-bold'>2. AI Understands the Context</span>
                 Dharma AI analyzes your message to understand the emotions, intent, and context of your concern.
              <span className='text-lg font-bold'>3. Receive Thoughtful Guidance</span>
                 The system generates guidance inspired by relevant teachings and stories from the Bhagavad Gita and Mahabharata, encouraging reflection and informed decision-making.
            </p>
          </div>

          <div className='text-[#ffffff] mt-4'>
            <h2 className='text-2xl font-bold pb-2'>Disclaimer</h2>
            <p>
              Dharma AI is designed for personal reflection and guidance. Responses are AI-generated and inspired by the Bhagavad Gita and the Mahabharata. They are not a substitute for professional medical, psychological, legal, or financial advice.
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}

export default About