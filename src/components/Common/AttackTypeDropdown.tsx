import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Flag, Check, CheckCircle } from 'lucide-react';
import { ATTACK_TYPES } from '../../types';

interface AttackTypeDropdownProps {
  packetId: string;
  currentFlag?: string;
  onFlag: (attackType: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const AttackTypeDropdown: React.FC<AttackTypeDropdownProps> = ({
  packetId,
  currentFlag,
  onFlag,
  disabled = false,
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        zIndex: 9999,
        width: 256 // 64 * 4 px (w-64)
      });
    }
  }, [isOpen]);

  const allAttackTypes = [
    ...ATTACK_TYPES.APT,
    ...ATTACK_TYPES.DDOS,
    ...ATTACK_TYPES.OTHER
  ];

  const handleSelect = async (attackType: string) => {
    setIsLoading(true);
    try {
      await onFlag(attackType);
      setIsOpen(false);
      
      // Show feedback popup
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    } catch (error) {
      console.error('Failed to flag packet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (currentFlag) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`inline-flex items-center space-x-1 ${buttonSize} bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Check className={iconSize} />
          <span className="truncate max-w-24">{currentFlag.split(' - ')[1] || currentFlag}</span>
          {!disabled && <ChevronDown className={`${iconSize} ${isOpen ? 'rotate-180' : ''} transition-transform`} />}
        </button>

        {isOpen && !disabled && ReactDOM.createPortal(
          <div style={dropdownStyle} className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-2 font-medium">Change Classification:</div>
              
              <div className="text-xs text-cyan-400 mb-2 font-medium">APT Attacks:</div>
              {ATTACK_TYPES.APT.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors disabled:opacity-50"
                >
                  {type}
                </button>
              ))}
              
              <div className="text-xs text-cyan-400 mb-2 mt-3 font-medium">DDoS Attacks:</div>
              {ATTACK_TYPES.DDOS.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors disabled:opacity-50"
                >
                  {type}
                </button>
              ))}
              
              <div className="text-xs text-cyan-400 mb-2 mt-3 font-medium">Normal Traffic:</div>
              {ATTACK_TYPES.OTHER.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors disabled:opacity-50"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

        {/* Feedback Popup */}
        {showFeedback && (
          <div className="absolute top-full left-0 mt-2 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Feedback sent!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`inline-flex items-center space-x-1 ${buttonSize} bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Flag className={iconSize} />
        <span className="font-medium">Flag Attack</span>
        <ChevronDown className={`${iconSize} ${isOpen ? 'rotate-180' : ''} transition-transform`} />
      </button>

      {isOpen && ReactDOM.createPortal(
        <div style={dropdownStyle} className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-cyan-400 mb-2 font-medium">APT Attacks:</div>
            {ATTACK_TYPES.APT.map((type) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors disabled:opacity-50"
              >
                {type}
              </button>
            ))}
            
            <div className="text-xs text-cyan-400 mb-2 mt-3 font-medium">DDoS Attacks:</div>
            {ATTACK_TYPES.DDOS.map((type) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors disabled:opacity-50"
              >
                {type}
              </button>
            ))}
            
            <div className="text-xs text-cyan-400 mb-2 mt-3 font-medium">Normal Traffic:</div>
            {ATTACK_TYPES.OTHER.map((type) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors disabled:opacity-50"
              >
                {type}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded">
          <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Feedback Popup */}
      {showFeedback && (
        <div className="absolute top-full left-0 mt-2 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Feedback sent!</span>
        </div>
      )}
    </div>
  );
};

export default AttackTypeDropdown;