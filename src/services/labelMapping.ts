// src/utils/attackLabelMapping.ts

// Mappings for 'DOS' attack type and its corresponding label numbers
const DOS_LABEL_MAPPINGS: { [key: number]: string } = {
  0: 'Normal Traffic',
  1: 'DNS Flood',
  2: 'DDoS MSSQL',
  3: 'DDoS NTP',
  4: 'DDoS SSDP',
  5: 'Syn Flood',
};

// Mappings for 'APT' attack type and its corresponding label numbers
const APT_LABEL_MAPPINGS: { [key: number]: string } = {
  0: 'Data Exfiltration',
  1: 'Initial Compromise',
  2: 'Lateral Movement',
  3: 'Normal Traffic', // Important: Label 3 for APT is Normal Traffic
  4: 'Pivoting',
  5: 'Reconnaissance',
};

/**
 * Maps the raw attack_type and label from a packet to a user-friendly display string.
 * This function prioritizes "Normal Traffic" if conditions match, then specific attack labels,
 * and finally falls back to the attackType string or a generic message.
 *
 * @param {string | null | undefined} attackType The string identifying the attack type (e.g., 'DOS', 'APT', 'NORMAL').
 * @param {number | string | null | undefined} label The numerical label associated with the attack.
 * @returns {string} The human-readable attack label string.
 */
export const getAttackLabelString = (
  attackType: string | null | undefined,
  label: number | string | null | undefined
): string => {
  console.log({
    rawAttackType: attackType,
    trimmedAttackType: attackType?.trim(),
    normalisedAttackType: attackType?.trim().toUpperCase(),
    rawLabel: label,
    labelNumber: Number(label),
  });
  // Normalize label to a number for consistent comparison. NaN if not a valid number.
  const labelNumber = Number(label);
  
  // Normalize attackType to uppercase for consistent matching.
  const normalizedAttackType = attackType ? attackType.toUpperCase() : null;

  // --- 1. Handle "Normal Traffic" cases with highest priority ---
  // A packet is considered "Normal Traffic" if:
  // a) attackType is explicitly 'NORMAL'
  // b) attackType is 'DOS' and label is 0
  // c) attackType is 'APT' and label is 3
  // d) No attackType AND label is 0 or 3 (covers cases where only a normal label is sent)
  if (
    normalizedAttackType === 'NORMAL' ||
    (normalizedAttackType === 'DOS' && labelNumber === 0) ||
    (normalizedAttackType === 'APT' && labelNumber === 3) ||
    (!normalizedAttackType && (labelNumber === 0 || labelNumber === 3)) // This catches the generic label 3 for normal traffic
  ) {
    return 'Normal Traffic';
  }

  // --- 2. Handle specific attack types based on normalizedAttackType and labelNumber ---
  if (normalizedAttackType) {
    switch (normalizedAttackType) {
      case 'APT':
        // If it's APT and we have a valid non-normal label, try to map it.
        // Fallback to "Unknown APT (label)" if label not found in map.
        if (!isNaN(labelNumber)) {
          return APT_LABEL_MAPPINGS[labelNumber] || `Unknown APT (${labelNumber})`;
        }
        break; // Break to default if label is NaN for APT or not a recognized label
      case 'DOS':
        // If it's DOS and we have a valid non-normal label, try to map it.
        // Fallback to "Unknown DOS (label)" if label not found in map.
        if (!isNaN(labelNumber)) {
          return DOS_LABEL_MAPPINGS[labelNumber] || `Unknown DOS (${labelNumber})`;
        }
        break; // Break to default if label is NaN for DOS or not a recognized label
      default:
        // For any other explicit attackType string (e.g., 'MALWARE', 'EXPLOIT')
        // if no specific label mapping applies, just return the attackType itself.
        return normalizedAttackType;
    }
  }
  
  // --- 3. Fallback for scenarios not explicitly handled above ---
  // This typically means:
  // - attackType is missing/null/undefined AND labelNumber is not 0 or 3 (i.e., not normal)
  // - attackType was 'APT' or 'DOS' but labelNumber was NaN (and not normal)
  // - attackType was something unrecognized but a string (handled by default above)
  
  // If we have a numeric label, but no specific attack type mapping was found
  if (!isNaN(labelNumber)) {
    return `Label: ${labelNumber}`; // Return "Label: X" if it's just a raw number not mapped to normal
  }

  // Final fallback if no meaningful data is present (attackType and label are missing/unmappable)
  return 'Analyzing...';
};