import { useState, useEffect} from 'react'
import './App.css'


function App() {
  const [status, setStatus] = useState('...');

  useEffect(() => {
    fetch('api/health').then(res=>res.json()).then(d=>setStatus(JSON.stringify(d)));
  },[]);
  return (
    <>
      <div className='p-6'>
        <h1>Job Automation Agent</h1>
        <pre>{status}</pre>
      </div>
    </>
  )
}

export default App
