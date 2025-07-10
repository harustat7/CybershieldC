import { useState, useEffect, useCallback } from 'react';
import { NetworkPacket, AttackDetection } from '../types';
import { generateMockPacket, generateMockAttackDetection } from '../utils/mockData';

export const useRealTimePackets = (maxPackets: number = 30, isLive: boolean = true): [NetworkPacket[], React.Dispatch<React.SetStateAction<NetworkPacket[]>>] => {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);

  const addPacket = useCallback(() => {
    if (!isLive) return;
    
    const newPacket = generateMockPacket();
    setPackets(prev => [newPacket, ...prev.slice(0, maxPackets - 1)]);
  }, [maxPackets, isLive]);

  useEffect(() => {
    // Add initial packets
    const initialPackets = Array.from({ length: maxPackets }, () => generateMockPacket());
    setPackets(initialPackets);

    if (!isLive) return;

    // Add new packets every 1-2 seconds when live
    const interval = setInterval(() => {
      addPacket();
    }, Math.random() * 1000 + 1000);

    return () => clearInterval(interval);
  }, [addPacket, maxPackets, isLive]);

  return [packets, setPackets];
};

export const useRealTimeAttackDetection = () => {
  const [detection, setDetection] = useState<AttackDetection | null>(null);

  useEffect(() => {
    // Initial detection
    setDetection(generateMockAttackDetection());

    // Update detection every 10-30 seconds
    const interval = setInterval(() => {
      setDetection(generateMockAttackDetection());
    }, Math.random() * 20000 + 10000);

    return () => clearInterval(interval);
  }, []);

  return detection;
};