// import React, { useState } from 'react';import Navbar from './Navbar';
// import LiveTrafficMonitor from './LiveTrafficMonitor';
// import AIAttackDetection from './AIAttackDetection';
// import AttackHistoryLogs from './AttackHistoryLogs';

// interface DashboardProps {
//   onLogout: () => void;
// }

// const formatTimeHHMMSS = (dateTimeString: string | null) => {
//   if (!dateTimeString) return 'N/A';
//   if (/^\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) return dateTimeString;
  
//   try {
//     // If it's date+time, extract time part without any timezone conversion
//     const d = new Date(dateTimeString);
//     if (!isNaN(d.getTime())) {
//       // Get the time part directly from the original string to avoid timezone conversion
//       const timeMatch = dateTimeString.match(/(\d{2}:\d{2}:\d{2})/);
//       if (timeMatch) {
//         return timeMatch[1];
//       }
//       // Fallback: use UTC time to avoid timezone conversion
//       const utcTime = d.getUTCHours().toString().padStart(2, '0') + ':' +
//                      d.getUTCMinutes().toString().padStart(2, '0') + ':' +
//                      d.getUTCSeconds().toString().padStart(2, '0');
//       return utcTime;
//     }
    
//     // Fallback: try splitting by space or T
//     const parts = dateTimeString.split(/[ T]/);
//     if (parts.length > 1 && /^\d{2}:\d{2}:\d{2}/.test(parts[1])) {
//       return parts[1].slice(0, 8);
//     }
//   } catch (error) {
//     console.warn('Error parsing time:', dateTimeString, error);
//   }
  
//   return dateTimeString;
// };

// const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
//     const [isAnyTrafficActiveFromMonitor, setIsAnyTrafficActiveFromMonitor] = useState(false);
//   const [hasPacketsDisplayedFromMonitor, setHasPacketsDisplayedFromMonitor] = useState(false);

//   // This callback will be triggered by LiveTrafficMonitor
//   const handleTrafficStatusChange = (activeStatus: boolean, displayedStatus: boolean) => {
//     setIsAnyTrafficActiveFromMonitor(activeStatus);
//     setHasPacketsDisplayedFromMonitor(displayedStatus);
//   };
//   return (
//     <div className="min-h-screen bg-gray-950">
//       {/* Animated Background */}
//       <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-purple-950/20">
//         <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23374151" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
        
//         {/* Floating Elements */}
//         <div className="absolute top-20 left-10 w-32 h-32 border border-cyan-500/10 rounded-full animate-pulse"></div>
//         <div className="absolute bottom-20 right-10 w-24 h-24 border border-purple-500/10 rounded-full animate-bounce"></div>
//         <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping"></div>
//         <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/30 rounded-full animate-ping delay-700"></div>
//         <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-green-400/30 rounded-full animate-ping delay-1000"></div>
//       </div>

//       {/* Content */}
//       <div className="relative z-10">
//         <Navbar onLogout={onLogout} />
        
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//             {/* Live Traffic Monitor */}
//             <div className="lg:col-span-1">
//               <LiveTrafficMonitor onTrafficStatusChange={handleTrafficStatusChange} />            </div>
            
//             {/* AI Attack Detection */}
//             <div className="lg:col-span-1">
//               <AIAttackDetection
//                 isAnyTrafficActive={isAnyTrafficActiveFromMonitor}
//                 hasPacketsDisplayed={hasPacketsDisplayedFromMonitor}
//               />
//               </div>
//           </div>

//           {/* Attack History Logs */}
//           <div className="mb-6">
//             <AttackHistoryLogs />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

 // Dashboard.tsx

 import React, { useState, useEffect } from 'react';
 import Navbar from './Navbar';
 import LiveTrafficMonitor from './LiveTrafficMonitor';
 import AIAttackDetection from './AIAttackDetection';
 import AttackHistoryLogs from './AttackHistoryLogs';
 import { useSupabasePackets } from './../../hooks/useSupabasePackets';
 import { NetworkPacket } from '../../types';
 import { Dispatch, SetStateAction } from 'react';


 interface DashboardProps {
   onLogout: () => void;
 }

 const formatTimeHHMMSS = (dateTimeString: string | null) => {
   if (!dateTimeString) return 'N/A';
   if (/^\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) return dateTimeString;
   
   try {
     const d = new Date(dateTimeString);
     if (!isNaN(d.getTime())) {
       const timeMatch = dateTimeString.match(/(\d{2}:\d{2}:\d{2})/);
       if (timeMatch) {
         return timeMatch[1];
       }
       const utcTime = d.getUTCHours().toString().padStart(2, '0') + ':' +
                      d.getUTCMinutes().toString().padStart(2, '0') + ':' +
                      d.getUTCSeconds().toString().padStart(2, '0');
       return utcTime;
     }
     
     const parts = dateTimeString.split(/[ T]/);
     if (parts.length > 1 && /^\d{2}:\d{2}:\d{2}/.test(parts[1])) {
       return parts[1].slice(0, 8);
     }
   } catch (error) {
     console.warn('Error parsing time:', dateTimeString, error);
   }
   
   return dateTimeString;
 };

 const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
     const [isAnyTrafficActiveFromMonitor, setIsAnyTrafficActiveFromMonitor] = useState(false);
   const [hasPacketsDisplayedFromMonitor, setHasPacketsDisplayedFromMonitor] = useState(false);
  const [currentPacket, setCurrentPacket] = useState<NetworkPacket | null>(null);

   // ⬇️ 2. Hook after state (Dashboard is the central fetcher)
   const { packets, loading, error } = useSupabasePackets(10, isAnyTrafficActiveFromMonitor); // Keep this line as is

   // ⬇️ 3. Update current packet when new data arrives from Dashboard's fetch
   useEffect(() => {
     if (packets.length > 0 && packets[0]?.id !== currentPacket?.id) {
       setCurrentPacket(packets[0]); // Always pick latest
     } else if (packets.length === 0 && currentPacket !== null) {
       setCurrentPacket(null); // Clear current packet if no packets are being fetched
     }
   }, [packets, currentPacket]); // ADD currentPacket to dependencies for stable comparison

   // This callback will be triggered by LiveTrafficMonitor
   const handleTrafficStatusChange = (activeStatus: boolean, displayedStatus: boolean) => {
     setIsAnyTrafficActiveFromMonitor(activeStatus);
     setHasPacketsDisplayedFromMonitor(displayedStatus);
   };
   return (
     <div className="min-h-screen bg-gray-950">
       {/* Animated Background */}
       <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-purple-950/20">
         <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23374151" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
         
         {/* Floating Elements */}
         <div className="absolute top-20 left-10 w-32 h-32 border border-cyan-500/10 rounded-full animate-pulse"></div>
         <div className="absolute bottom-20 right-10 w-24 h-24 border border-purple-500/10 rounded-full animate-bounce"></div>
         <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping"></div>
         <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/30 rounded-full animate-ping delay-700"></div>
         <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-green-400/30 rounded-full animate-ping delay-1000"></div>
       </div>

       {/* Content */}
       <div className="relative z-10">
         <Navbar onLogout={onLogout} />
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
             {/* Live Traffic Monitor */}
             <div className="lg:col-span-1">
               <LiveTrafficMonitor onTrafficStatusChange={handleTrafficStatusChange}
   packets={packets}
   currentPacket={currentPacket}
   onSelectPacket={setCurrentPacket} 
   loading={loading} // PASS loading from Dashboard's hook
   error={error} // PASS error from Dashboard's hook
/>            </div>
             
             {/* AI Attack Detection */}
             <div className="lg:col-span-1">
               <AIAttackDetection
                 currentPacket={currentPacket}
   isAnyTrafficActive={isAnyTrafficActiveFromMonitor}
   hasPacketsDisplayed={hasPacketsDisplayedFromMonitor}
 loading={loading} // PASS loading from Dashboard's hook
  error={error} // PASS error from Dashboard's hook
               />
               </div>
           </div>

           {/* Attack History Logs */}
           <div className="mb-6">
             <AttackHistoryLogs />
           </div>
         </div>
       </div>
     </div>
   );
 };

 export default Dashboard;