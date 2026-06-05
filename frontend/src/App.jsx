import { useEffect, useState } from 'react'
import { getHealthStatus } from './api/healthApi.js'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking backend...')

  useEffect(() => {
    getHealthStatus()
      .then((data) => setApiStatus(data.message))
      .catch((error) => setApiStatus(error.message))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-300">
          Ecommerce MERN Stack
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Frontend is ready
        </h1>
        <p className="mt-4 max-w-xl text-slate-400">
          React + Vite + Tailwind CSS. Start building your ecommerce app from
          here.
        </p>
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 px-6 py-4">
          <p className="text-sm text-slate-400">API status</p>
          <p className="mt-1 font-medium text-white">{apiStatus}</p>
        </div>
      </main>
    </div>
  )
}

export default App
