// src/api/flagService.ts

import { FlagRequest, AllTrafficDataDbRow, ATTACK_TYPES } from '../types';
import { getOriginalTrafficData, insertFlaggedTraffic } from './../../supabase/queries';
import { prepareDataForFlaggedTable, FLAGGED_APT_TARGET_COLUMN_NAMES, FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES } from '../utils/featureDefinitions';

// --- Constants for Normal Labels (based on common patterns and your schemas) ---
// Assuming numerical label 3 for Normal in APT context
const APT_NORMAL_LABEL_NUM = 3;
const APT_NORMAL_LABEL_STRING = ATTACK_TYPES.APT.find(type => type.includes('Normal')) || 'Normal (APT Context)';

// Assuming numerical label 0 for Normal in DOS context
const DOS_NORMAL_LABEL_NUM = 0;
const DOS_NORMAL_LABEL_STRING = ATTACK_TYPES.DDOS.find(type => type.includes('Normal')) || 'Normal (DOS Context)';


/**
 * Helper to determine the broad category (APT, DOS, or General Normal) of a given attack type string.
 * This is crucial for cross-classification logic.
 * @param attackTypeString The attack type string (e.g., 'Pivoting', 'DNS', 'Normal (APT Context)').
 * @returns 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN'
 */
function getAttackTypeCategory(attackTypeString: string): 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN' {
    if (ATTACK_TYPES.APT.includes(attackTypeString as any) && attackTypeString !== APT_NORMAL_LABEL_STRING) {
        return 'APT';
    }
    if (ATTACK_TYPES.DDOS.includes(attackTypeString as any) && attackTypeString !== DOS_NORMAL_LABEL_STRING) {
        return 'DOS';
    }
    if (attackTypeString === APT_NORMAL_LABEL_STRING) {
        return 'NORMAL_APT';
    }
    if (attackTypeString === DOS_NORMAL_LABEL_STRING) {
        return 'NORMAL_DOS';
    }
    // Handle the generic 'Normal' if it exists in ATTACK_TYPES.OTHER
    if (ATTACK_TYPES.OTHER.includes(attackTypeString as any)) {
      // This is ambiguous. For flagging, it's better to force a context or clarify.
      // For now, if 'Normal' is flagged, it implies making it normal for both contexts,
      // but this needs careful consideration of how you want to interpret generic 'Normal'
      // flags if it's not specific like 'Normal (APT Context)'.
      // For this solution, we assume a specific Normal context will be passed if possible,
      // or default to DOS_NORMAL_LABEL_NUM/STRING if generic 'Normal' is given (as per common_data label 0 implies DOS normal).
      return 'NORMAL_DOS'; // Defaulting generic 'Normal' to DOS context for flagging
    }
    return 'UNKNOWN';
}

/**
 * Handles the user's request to flag a network traffic packet.
 * This function orchestrates fetching original data, transforming it,
 * and inserting it into the appropriate flagged database table(s).
 *
 * @param request The FlagRequest object containing details from the frontend.
 * @returns A Promise resolving to an object indicating success or failure.
 */
export async function handleFlagTrafficRequest(request: FlagRequest): Promise<{ success: boolean; message: string }> {
    try {
        const {
            packetId,
            userattackType, // This is the new classification provided by the user
            originalLabel,
            originalAttackType,
            timestamp, // Corresponds to NetworkPacket.time, event timestamp from common_data
            flowDuration,
            sourceIP,
            destinationIP,
            protocol,
            srcPort,
            dstPort // Correctly destructured
        } = request;

        // Basic validation of essential original classification info
        if (!originalAttackType || originalLabel === null || originalLabel === undefined) {
            return { success: false, message: "Missing essential original classification information (originalAttackType or originalLabel)." };
        }

        // Convert originalLabel string (from frontend) to number (as stored in DB)
        const originalMlLabelNum = parseFloat(originalLabel);
        if (isNaN(originalMlLabelNum)) {
            return { success: false, message: "Invalid format for original label; expected a number." };
        }

        // 1. Fetch the original packet data from 'all_traffic_data' via 'common_data'
        console.log(`[FlagService] Fetching original packet data for common_data.id: ${packetId}, original type: ${originalAttackType}, label: ${originalMlLabelNum}`);
        const originalData: AllTrafficDataDbRow | null = await getOriginalTrafficData(
            parseInt(packetId), // packetId from frontend is common_data.id
            timestamp || '', // common_data.time
            flowDuration,
            sourceIP,
            destinationIP, // common_data.dest_ip
            protocol,
            srcPort,
            dstPort, // common_data.dst_port
            originalAttackType, // Passed for internal logic to determine target table
            originalMlLabelNum // Passed for internal logic to determine target table
        );

        if (!originalData) {
            return { success: false, message: `Original packet with common_data.id ${packetId} not found in all_traffic_data.` };
        }

        // Determine the original context of the packet
        const originalContextIsApt = originalAttackType === 'APT' || (originalAttackType === 'Normal' && originalMlLabelNum !== DOS_NORMAL_LABEL_NUM);
        const originalContextIsDos = originalAttackType === 'DOS' || (originalAttackType === 'Normal' && originalMlLabelNum === DOS_NORMAL_LABEL_NUM);

        // Determine the context of the user's NEW classification
        const userNewClassificationCategory = getAttackTypeCategory(userattackType);

        const insertionPromises: Promise<void>[] = [];
        let finalMessage: string = `Packet ID ${packetId} successfully flagged.`;

        // Case 1: Original was APT-related
        if (originalContextIsApt) {
            // If user reclassifies as DOS attack (cross-classification)
            if (userNewClassificationCategory === 'DOS') {
                console.log(`[FlagService] Cross-classification: Original APT, User flagged as DOS. Inserting into both flagged_apt (as Normal) and flag_traffic_dos.`);
                finalMessage = `Packet ID ${packetId} (originally APT) reclassified as DOS (${userattackType}). Marked Normal for APT context.`;

                // Insert into flagged_apt, marking original APT as Normal
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType, // Original APT context
                    originalMlLabelNum, // Use original ML numerical label for 'Label'
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    APT_NORMAL_LABEL_STRING // New label for APT context is 'Normal'
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));

                // Insert into flag_traffic_dos with the new DOS attack type
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType, // Original context (APT), but will map to DOS target
                    originalMlLabelNum, // Use original ML numerical label for 'label'
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    userattackType // User's specific DOS attack type
                );
                // flag_traffic_dos requires created_at as flagging timestamp
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));

            } else { // User reclassifies as APT, or Normal (APT Context), or other 'Normal'
                console.log(`[FlagService] Direct reclassification/Normal within APT context. Inserting into flagged_apt.`);
                finalMessage = `Packet ID ${packetId} (originally APT) reclassified as ${userattackType} in APT context.`;

                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum,
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    userattackType // User's new APT label or Normal (APT Context)
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));
            }
        }
        // Case 2: Original was DOS-related
        else if (originalContextIsDos) {
            // If user reclassifies as APT attack (cross-classification)
            if (userNewClassificationCategory === 'APT') {
                console.log(`[FlagService] Cross-classification: Original DOS, User flagged as APT. Inserting into both flag_traffic_dos (as Normal) and flagged_apt.`);
                finalMessage = `Packet ID ${packetId} (originally DOS) reclassified as APT (${userattackType}). Marked Normal for DOS context.`;

                // Insert into flag_traffic_dos, marking original DOS as Normal
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType, // Original DOS context
                    originalMlLabelNum, // Use original ML numerical label for 'label'
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    DOS_NORMAL_LABEL_STRING // New label for DOS context is 'Normal'
                );
                // flag_traffic_dos requires created_at as flagging timestamp
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));

                // Insert into flagged_apt with the new APT attack type
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType, // Original context (DOS), but will map to APT target
                    originalMlLabelNum, // Use original ML numerical label for 'Label'
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    userattackType // User's specific APT attack type
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));

            } else { // User reclassifies as DOS, or Normal (DOS Context), or other 'Normal'
                console.log(`[FlagService] Direct reclassification/Normal within DOS context. Inserting into flag_traffic_dos.`);
                finalMessage = `Packet ID ${packetId} (originally DOS) reclassified as ${userattackType} in DOS context.`;

                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum,
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    userattackType // User's new DOS label or Normal (DOS Context)
                );
                // flag_traffic_dos requires created_at as flagging timestamp
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));
            }
        } else {
            // This case should ideally not be reached if originalAttackType is always 'APT', 'DOS', or 'Normal'
            // and originalMlLabelNum allows differentiation for 'Normal'.
            console.warn(`[FlagService] Unhandled original classification type: ${originalAttackType} with label ${originalMlLabelNum}. Defaulting to single insertion based on user's new classification.`);
            if (userNewClassificationCategory === 'APT' || userNewClassificationCategory === 'NORMAL_APT') {
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum,
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    userattackType
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));
            } else if (userNewClassificationCategory === 'DOS' || userNewClassificationCategory === 'NORMAL_DOS' || userNewClassificationCategory === 'UNKNOWN') { // UNKNOWN defaults to DOS for flagging
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum,
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    userattackType
                );
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));
            } else {
                 return { success: false, message: `Could not process flagging request: Unclear original or new classification context.` };
            }
        }


        // Execute all pending insertion promises concurrently
        await Promise.all(insertionPromises);

        return { success: true, message: finalMessage };

    } catch (error) {
        console.error('[FlagService] Error handling flag traffic request:', error);
        return { success: false, message: `Failed to flag traffic: ${(error as Error).message}` };
    }
}