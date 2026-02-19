import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LabPage from './pages/LabPage'

export default function App() {
    const [page, setPage] = useState('landing')

    return (
        <div className="min-h-screen bg-cyber-black">
            {page === 'landing' && <LandingPage onEnterLab={() => setPage('lab')} />}
            {page === 'lab' && <LabPage onBack={() => setPage('landing')} />}
        </div>
    )
}
