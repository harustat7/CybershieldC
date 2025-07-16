// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { NetworkPacket, SupabasePacket } from '../types';

// export const useSupabasePackets = (limit: number = 25, isActive: boolean = true) => {
//   const [packets, setPackets] = useState<NetworkPacket[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Transform Supabase data to NetworkPacket format
//   const transformPacket = (supabasePacket: SupabasePacket): NetworkPacket => {
//     // Map label to status
//     const getStatus = (label: string | null): 'normal' | 'suspicious' | 'malicious' => {
//       if (!label) return 'normal';
//       const l = label.toLowerCase();
//       if (l.includes('normal') || l.includes('benign')) return 'normal';
//       if (l.includes('dos') || l.includes('ddos') || l.includes('attack')) return 'malicious';
//       if (l.includes('apt') || l.includes('suspicious')) return 'suspicious';
//       return 'normal';
//     };

//     return {
//       id: supabasePacket.id,
//       time: supabasePacket.time,
//       sourceIP: supabasePacket.src_ip,
//       destinationIP: supabasePacket.dest_ip,
//       attack_type: supabasePacket.attack_type,
//       protocol: supabasePacket.protocol.toUpperCase(),
//       srcPort: Number(supabasePacket.src_port),
//       dstPort: Number(supabasePacket.dst_port),
//       flowDuration: Number(supabasePacket.flow_duration),
//       label: supabasePacket.label,
//       status: getStatus(supabasePacket.label ?? ''),
//     };
//   };

//   // Fetch packets from Supabase
//   const fetchPackets = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const { data, error } = await supabase
//         .from('common_data')
//         .select('*')
//         .order('time', { ascending: false })
//         .limit(limit);

//       if (error) {
//         throw error;
//       }

//       if (data) {
//         const transformedPackets = data.map(transformPacket);
//         setPackets(transformedPackets);
//       }
//     } catch (err) {
//       console.error('Error fetching packets:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch packets');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Real-time subscription for new packets
//   useEffect(() => {
// if (!isActive) { // This line was already here
//       setPackets([]);     // <--- ADD THIS LINE
//       setLoading(false);  // <--- ADD THIS LINE
//       setError(null);     // <--- ADD THIS LINE
//       return;             // This line was already here
//     }
//     // Initial fetch
//     fetchPackets();

//     // Set up real-time subscription
//     const subscription = supabase
//       .channel('common_data_changes')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'common_data'
//         },
//         (payload) => {
//           const newPacket = transformPacket(payload.new as SupabasePacket);
//           setPackets(prev => [newPacket, ...prev.slice(0, limit - 1)]);
//         }
//       )
//       .subscribe();

//     // Refresh data every 10 seconds
//     const interval = setInterval(fetchPackets, 10000);

//     return () => {
//       subscription.unsubscribe();
//       clearInterval(interval);
//     };
//   }, [limit, isActive]);

//   return { packets, loading, error, refetch: fetchPackets };
// };


import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NetworkPacket, SupabasePacket } from '../types';

export const useSupabasePackets = (limit: number = 25, isActive: boolean = true) => {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform Supabase data to NetworkPacket format
  const transformPacket = (supabasePacket: SupabasePacket): NetworkPacket => {
    // Map label to status
    const getStatus = (label: string | null): 'normal' | 'suspicious' | 'malicious' => {
      if (!label) return 'normal';
      const l = label.toLowerCase();
      if (l.includes('normal') || l.includes('benign')) return 'normal';
      if (l.includes('dos') || l.includes('ddos') || l.includes('attack')) return 'malicious';
      if (l.includes('apt') || l.includes('suspicious')) return 'suspicious';
      return 'normal';
    };

    return {
      id: supabasePacket.id,
      time: supabasePacket.time,
      sourceIP: supabasePacket.src_ip,
      destinationIP: supabasePacket.dest_ip,
      attack_type: supabasePacket.attack_type,
      protocol: supabasePacket.protocol.toUpperCase(),
      srcPort: Number(supabasePacket.src_port),
      dstPort: Number(supabasePacket.dst_port),
      flowDuration: Number(supabasePacket.flow_duration),
      label: supabasePacket.label,
      status: getStatus(supabasePacket.label ?? ''),
    };
  };

  // Fetch packets from Supabase
  const fetchPackets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('common_data')
        .select('*')
        .order('time', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      if (data) {
        const transformedPackets = data.map(transformPacket);
        setPackets(transformedPackets);
      }
    } catch (err) {
      console.error('Error fetching packets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch packets');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for new packets
  useEffect(() => {
if (!isActive) { // This line was already here
      setPackets([]);     // <--- ADD THIS LINE
      setLoading(false);  // <--- ADD THIS LINE
      setError(null);     // <--- ADD THIS LINE
      return;             // This line was already here
    }
    // Initial fetch
    fetchPackets();

    // Set up real-time subscription
    const subscription = supabase
      .channel('common_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'common_data'
        },
        (payload) => {
          const newPacket = transformPacket(payload.new as SupabasePacket);
          setPackets(prev => [newPacket, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe();

    // Refresh data every 10 seconds
    const interval = setInterval(fetchPackets, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [limit, isActive]);

  return { packets, loading, error, refetch: fetchPackets };
};



// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { NetworkPacket, SupabasePacket } from '../types';

// export const useSupabasePackets = (limit: number = 25, isActive: boolean = true) => {
//   const [packets, setPackets] = useState<NetworkPacket[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Transform Supabase data to NetworkPacket format
//   const transformPacket = (supabasePacket: SupabasePacket): NetworkPacket => {
//     // Map label to status
//     const getStatus = (label: string | null): 'normal' | 'suspicious' | 'malicious' => {
//       if (!label) return 'normal';
//       const l = label.toLowerCase();
//       if (l.includes('normal') || l.includes('benign')) return 'normal';
//       if (l.includes('dos') || l.includes('ddos') || l.includes('attack')) return 'malicious';
//       if (l.includes('apt') || l.includes('suspicious')) return 'suspicious';
//       return 'normal';
//     };

//     return {
//       id: supabasePacket.id,
//       time: supabasePacket.time,
//       sourceIP: supabasePacket.src_ip,
//       destinationIP: supabasePacket.dest_ip,
//       protocol: supabasePacket.protocol.toUpperCase(),
//       srcPort: Number(supabasePacket.src_port),
//       dstPort: Number(supabasePacket.dst_port),
//       flowDuration: Number(supabasePacket.flow_duration),
//       label: supabasePacket.label,
//       status: getStatus(supabasePacket.label ?? ''),
//     };
//   };

//   // Fetch packets from Supabase
//   const fetchPackets = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const { data, error } = await supabase
//         .from('common_data')
//         .select('*')
//         .order('time', { ascending: false })
//         .limit(limit);

//       if (error) {
//         throw error;
//       }

//       if (data) {
//         const transformedPackets = data.map(transformPacket);
//         setPackets(transformedPackets);
//       }
//     } catch (err) {
//       console.error('Error fetching packets:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch packets');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Real-time subscription for new packets
//   useEffect(() => {
//     if (!isActive) return;

//     // Initial fetch
//     fetchPackets();

//     // Set up real-time subscription
//     const subscription = supabase
//       .channel('common_data_changes')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'common_data'
//         },
//         (payload) => {
//           const newPacket = transformPacket(payload.new as SupabasePacket);
//           setPackets(prev => [newPacket, ...prev.slice(0, limit - 1)]);
//         }
//       )
//       .subscribe();

//     // Refresh data every 10 seconds
//     const interval = setInterval(fetchPackets, 10000);

//     return () => {
//       subscription.unsubscribe();
//       clearInterval(interval);
//     };
//   }, [limit, isActive]);

//   return { packets, loading, error, refetch: fetchPackets };
// };