import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import TaskDetail from './TaskDetail'
import './index.css'
import './styles/theme.css'; 
import './styles/global.css';
import './styles/layout.css';
import './styles/cards.css';
import './styles/buttons.css';
import './styles/status.css';
import './styles/logs.css';
import './styles/taskdetail.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/task/:id" element={<TaskDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)





// {Array.isArray(task.result.actions) &&
//                 task.result.actions.length > 0 ? (
//                   <div style={{ marginBottom: 8 }}>
//                     <p style={{ fontSize: "0.9rem", marginBottom: 2 }}>
//                       <strong>Planned Actions:</strong>
//                     </p>
//                     <ol style={{ paddingLeft: "1.25rem", fontSize: "0.85rem" }}>
//                       {task.result.actions.map((action, idx) => (
//                         <li key={idx} style={{ marginBottom: 4 }}>
//                           <div>
//                             <strong>Type:</strong> {action.type}{" "}
//                           </div>
//                           <div>
//                             <strong>Description:</strong> {action.description}
//                           </div>
//                           {action.params && (
//                             <div>
//                               <strong>Params:</strong>{" "}
//                               <code>{JSON.stringify(action.params)}</code>
//                             </div>
//                           )}
//                         </li>
//                       ))}
//                     </ol>
//                   </div>
//                 ) : (
//                   <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
//                     {JSON.stringify(task.result, null, 2)}
//                   </pre>
//                 )}
//                 {/* NEW: show search results if present */}
//                 {task.result.data &&
//                   Array.isArray(task.result.data.searchResults) && (
//                     <div style={{ marginTop: 6 }}>
//                       <p style={{ fontSize: "0.9rem", marginBottom: 2 }}>
//                         <strong>Search Results:</strong>
//                       </p>
//                       <ul
//                         style={{ paddingLeft: "1.25rem", fontSize: "0.85rem" }}
//                       >
//                         {task.result.data.searchResults.map((r, idx) => (
//                           <li key={idx} style={{ marginBottom: 4 }}>
//                             <a href={r.url} target="_blank" rel="noreferrer">
//                               {r.title || r.url}
//                             </a>
//                             {r.snippet && (
//                               <div style={{ fontSize: "0.8rem" }}>
//                                 {r.snippet}
//                               </div>
//                             )}
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}
//                 /* NEW: summary + skills */
//                 {task.result.data &&
//                   (task.result.data.summary ||
//                     (task.result.data.skills &&
//                       task.result.data.skills.length > 0)) && (
//                     <div style={{ marginTop: 6 }}>
//                       {task.result.data.summary && (
//                         <p style={{ fontSize: "0.9rem", marginBottom: 4 }}>
//                           <strong>Skills Summary:</strong>{" "}
//                           {task.result.data.summary}
//                         </p>
//                       )}
//                       {Array.isArray(task.result.data.skills) &&
//                         task.result.data.skills.length > 0 && (
//                           <div>
//                             <p style={{ fontSize: "0.9rem", marginBottom: 2 }}>
//                               <strong>Key Skills:</strong>
//                             </p>
//                             <ul
//                               style={{
//                                 paddingLeft: "1.25rem",
//                                 fontSize: "0.85rem",
//                               }}
//                             >
//                               {task.result.data.skills.map((skill, idx) => (
//                                 <li key={idx}>{skill}</li>
//                               ))}
//                             </ul>
//                           </div>
//                         )}
//                     </div>
//                   )}