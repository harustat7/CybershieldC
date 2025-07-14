// // src/api/flagService.ts

// import { FlagRequest, AllTrafficDataDbRow, ATTACK_TYPES } from '../types';
// import { getOriginalTrafficData, insertFlaggedTraffic } from './../../supabase/queries';
// import { prepareDataForFlaggedTable, FLAGGED_APT_TARGET_COLUMN_NAMES, FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES } from '../utils/featureDefinitions';

// // --- Constants for Normal Labels (based on common patterns and your schemas) ---
// // Assuming numerical label 3 for Normal in APT context
// const APT_NORMAL_LABEL_NUM = 3;
// const APT_NORMAL_LABEL_STRING = ATTACK_TYPES.APT.find(type => type.includes('Normal')) || 'Normal (APT Context)';

// // Assuming numerical label 0 for Normal in DOS context
// const DOS_NORMAL_LABEL_NUM = 0;
// const DOS_NORMAL_LABEL_STRING = ATTACK_TYPES.DDOS.find(type => type.includes('Normal')) || 'Normal (DOS Context)';


// /**
//  * Helper to determine the broad category (APT, DOS, or General Normal) of a given attack type string.
//  * This is crucial for cross-classification logic.
//  * @param attackTypeString The attack type string (e.g., 'Pivoting', 'DNS', 'Normal (APT Context)').
//  * @returns 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN'
//  */
// function getAttackTypeCategory(attackTypeString: string): 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN' {
//     if (ATTACK_TYPES.APT.includes(attackTypeString as any) && attackTypeString !== APT_NORMAL_LABEL_STRING) {
//         return 'APT';
//     }
//     if (ATTACK_TYPES.DDOS.includes(attackTypeString as any) && attackTypeString !== DOS_NORMAL_LABEL_STRING) {
//         return 'DOS';
//     }
//     if (attackTypeString === APT_NORMAL_LABEL_STRING) {
//         return 'NORMAL_APT';
//     }
//     if (attackTypeString === DOS_NORMAL_LABEL_STRING) {
//         return 'NORMAL_DOS';
//     }
//     // Handle the generic 'Normal' if it exists in ATTACK_TYPES.OTHER
//     if (ATTACK_TYPES.OTHER.includes(attackTypeString as any)) {
//       // This is ambiguous. For flagging, it's better to force a context or clarify.
//       // For now, if 'Normal' is flagged, it implies making it normal for both contexts,
//       // but this needs careful consideration of how you want to interpret generic 'Normal'
//       // flags if it's not specific like 'Normal (APT Context)'.
//       // For this solution, we assume a specific Normal context will be passed if possible,
//       // or default to DOS_NORMAL_LABEL_NUM/STRING if generic 'Normal' is given (as per common_data label 0 implies DOS normal).
//       return 'NORMAL_DOS'; // Defaulting generic 'Normal' to DOS context for flagging
//     }
//     return 'UNKNOWN';
// }

// /**
//  * Handles the user's request to flag a network traffic packet.
//  * This function orchestrates fetching original data, transforming it,
//  * and inserting it into the appropriate flagged database table(s).
//  *
//  * @param request The FlagRequest object containing details from the frontend.
//  * @returns A Promise resolving to an object indicating success or failure.
//  */
// export async function handleFlagTrafficRequest(request: FlagRequest): Promise<{ success: boolean; message: string }> {
//     try {
//         const {
//             packetId,
//             userattackType, // This is the new classification provided by the user
//             originalLabel,
//             originalAttackType,
//             timestamp, // Corresponds to NetworkPacket.time, event timestamp from common_data
//             flowDuration,
//             sourceIP,
//             destinationIP,
//             protocol,
//             srcPort,
//             dstPort // Correctly destructured
//         } = request;

//         // Basic validation of essential original classification info
//         if (!originalAttackType || originalLabel === null || originalLabel === undefined) {
//             return { success: false, message: "Missing essential original classification information (originalAttackType or originalLabel)." };
//         }

//         // Convert originalLabel string (from frontend) to number (as stored in DB)
//         const originalMlLabelNum = parseFloat(originalLabel);
//         if (isNaN(originalMlLabelNum)) {
//             return { success: false, message: "Invalid format for original label; expected a number." };
//         }

//         // 1. Fetch the original packet data from 'all_traffic_data' via 'common_data'
//         console.log(`[FlagService] Fetching original packet data for common_data.id: ${packetId}, original type: ${originalAttackType}, label: ${originalMlLabelNum}`);
//         const originalData: AllTrafficDataDbRow | null = await getOriginalTrafficData(
//             parseInt(packetId), // packetId from frontend is common_data.id
//             timestamp || '', // common_data.time
//             flowDuration,
//             sourceIP,
//             destinationIP, // common_data.dest_ip
//             protocol,
//             srcPort,
//             dstPort, // common_data.dst_port
//             originalAttackType, // Passed for internal logic to determine target table
//             originalMlLabelNum // Passed for internal logic to determine target table
//         );

//         if (!originalData) {
//             return { success: false, message: `Original packet with common_data.id ${packetId} not found in all_traffic_data.` };
//         }

//         // Determine the original context of the packet
//         const originalContextIsApt = originalAttackType === 'APT' || (originalAttackType === 'Normal' && originalMlLabelNum !== DOS_NORMAL_LABEL_NUM);
//         const originalContextIsDos = originalAttackType === 'DOS' || (originalAttackType === 'Normal' && originalMlLabelNum === DOS_NORMAL_LABEL_NUM);

//         // Determine the context of the user's NEW classification
//         const userNewClassificationCategory = getAttackTypeCategory(userattackType);

//         const insertionPromises: Promise<void>[] = [];
//         let finalMessage: string = `Packet ID ${packetId} successfully flagged.`;

//         // Case 1: Original was APT-related
//         if (originalContextIsApt) {
//             // If user reclassifies as DOS attack (cross-classification)
//             if (userNewClassificationCategory === 'DOS') {
//                 console.log(`[FlagService] Cross-classification: Original APT, User flagged as DOS. Inserting into both flagged_apt (as Normal) and flag_traffic_dos.`);
//                 finalMessage = `Packet ID ${packetId} (originally APT) reclassified as DOS (${userattackType}). Marked Normal for APT context.`;

//                 // Insert into flagged_apt, marking original APT as Normal
//                 const aptDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType, // Original APT context
//                     originalMlLabelNum, // Use original ML numerical label for 'Label'
//                     FLAGGED_APT_TARGET_COLUMN_NAMES,
//                     APT_NORMAL_LABEL_STRING // New label for APT context is 'Normal'
//                 );
//                 insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));

//                 // Insert into flag_traffic_dos with the new DOS attack type
//                 const dosDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType, // Original context (APT), but will map to DOS target
//                     originalMlLabelNum, // Use original ML numerical label for 'label'
//                     FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
//                     userattackType // User's specific DOS attack type
//                 );
//                 // flag_traffic_dos requires created_at as flagging timestamp
//                 dosDataForInsertion.created_at = new Date().toISOString();
//                 insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));

//             } else { // User reclassifies as APT, or Normal (APT Context), or other 'Normal'
//                 console.log(`[FlagService] Direct reclassification/Normal within APT context. Inserting into flagged_apt.`);
//                 finalMessage = `Packet ID ${packetId} (originally APT) reclassified as ${userattackType} in APT context.`;

//                 const aptDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType,
//                     originalMlLabelNum,
//                     FLAGGED_APT_TARGET_COLUMN_NAMES,
//                     userattackType // User's new APT label or Normal (APT Context)
//                 );
//                 insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));
//             }
//         }
//         // Case 2: Original was DOS-related
//         else if (originalContextIsDos) {
//             // If user reclassifies as APT attack (cross-classification)
//             if (userNewClassificationCategory === 'APT') {
//                 console.log(`[FlagService] Cross-classification: Original DOS, User flagged as APT. Inserting into both flag_traffic_dos (as Normal) and flagged_apt.`);
//                 finalMessage = `Packet ID ${packetId} (originally DOS) reclassified as APT (${userattackType}). Marked Normal for DOS context.`;

//                 // Insert into flag_traffic_dos, marking original DOS as Normal
//                 const dosDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType, // Original DOS context
//                     originalMlLabelNum, // Use original ML numerical label for 'label'
//                     FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
//                     DOS_NORMAL_LABEL_STRING // New label for DOS context is 'Normal'
//                 );
//                 // flag_traffic_dos requires created_at as flagging timestamp
//                 dosDataForInsertion.created_at = new Date().toISOString();
//                 insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));

//                 // Insert into flagged_apt with the new APT attack type
//                 const aptDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType, // Original context (DOS), but will map to APT target
//                     originalMlLabelNum, // Use original ML numerical label for 'Label'
//                     FLAGGED_APT_TARGET_COLUMN_NAMES,
//                     userattackType // User's specific APT attack type
//                 );
//                 insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));

//             } else { // User reclassifies as DOS, or Normal (DOS Context), or other 'Normal'
//                 console.log(`[FlagService] Direct reclassification/Normal within DOS context. Inserting into flag_traffic_dos.`);
//                 finalMessage = `Packet ID ${packetId} (originally DOS) reclassified as ${userattackType} in DOS context.`;

//                 const dosDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType,
//                     originalMlLabelNum,
//                     FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
//                     userattackType // User's new DOS label or Normal (DOS Context)
//                 );
//                 // flag_traffic_dos requires created_at as flagging timestamp
//                 dosDataForInsertion.created_at = new Date().toISOString();
//                 insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));
//             }
//         } else {
//             // This case should ideally not be reached if originalAttackType is always 'APT', 'DOS', or 'Normal'
//             // and originalMlLabelNum allows differentiation for 'Normal'.
//             console.warn(`[FlagService] Unhandled original classification type: ${originalAttackType} with label ${originalMlLabelNum}. Defaulting to single insertion based on user's new classification.`);
//             if (userNewClassificationCategory === 'APT' || userNewClassificationCategory === 'NORMAL_APT') {
//                 const aptDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType,
//                     originalMlLabelNum,
//                     FLAGGED_APT_TARGET_COLUMN_NAMES,
//                     userattackType
//                 );
//                 insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));
//             } else if (userNewClassificationCategory === 'DOS' || userNewClassificationCategory === 'NORMAL_DOS' || userNewClassificationCategory === 'UNKNOWN') { // UNKNOWN defaults to DOS for flagging
//                 const dosDataForInsertion = prepareDataForFlaggedTable(
//                     originalData,
//                     originalAttackType,
//                     originalMlLabelNum,
//                     FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
//                     userattackType
//                 );
//                 dosDataForInsertion.created_at = new Date().toISOString();
//                 insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));
//             } else {
//                  return { success: false, message: `Could not process flagging request: Unclear original or new classification context.` };
//             }
//         }


//         // Execute all pending insertion promises concurrently
//         await Promise.all(insertionPromises);

//         return { success: true, message: finalMessage };

//     } catch (error) {
//         console.error('[FlagService] Error handling flag traffic request:', error);
//         return { success: false, message: `Failed to flag traffic: ${(error as Error).message}` };
//     }
// }


// src/api/flagService.ts

import { FlagRequest, AllTrafficDataDbRow, ATTACK_TYPES } from '../types';
import { getOriginalTrafficData, insertFlaggedTraffic } from './../../supabase/queries'; // Corrected path to db_queries
import { prepareDataForFlaggedTable, FLAGGED_APT_TARGET_COLUMN_NAMES, FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES } from '../utils/featureDefinitions';

// --- Constants for Normal Labels (matching database numerical values) ---
const APT_NORMAL_LABEL_NUM = 3;
const DOS_NORMAL_LABEL_NUM = 0;

// These are the string representations primarily for console logs or if needed elsewhere for display
const APT_NORMAL_LABEL_STRING = ATTACK_TYPES.APT.find(type => type.includes('Normal')) || 'Normal (APT Context)';
const DOS_NORMAL_LABEL_STRING = ATTACK_TYPES.DDOS.find(type => type.includes('Normal')) || 'Normal (DOS Context)';


/**
 * Helper to determine the broad category (APT, DOS, or Normal Context) of a given numerical attack label.
 * This is crucial for cross-classification logic.
 *
 * @param numericalLabel The numerical label (e.g., 0, 1, 3, 4, 5).
 * @param originalContextHint A hint like 'APT' or 'DOS' from the original classification's attack_type.
 *                            This helps disambiguate numerical labels that might overlap across contexts.
 * @returns 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN'
 */
function getNumericalLabelCategory(numericalLabel: number, originalContextHint?: 'APT' | 'DOS' | 'Normal'): 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN' {
    // Check for specific normal labels first based on confirmed numerical values
    if (numericalLabel === APT_NORMAL_LABEL_NUM) return 'NORMAL_APT';
    if (numericalLabel === DOS_NORMAL_LABEL_NUM) return 'NORMAL_DOS';

    // Heuristic based on your provided mapping ranges:
    // APT attack labels: 0, 1, 2, 4, 5
    // DOS attack labels: 1, 2, 3, 4, 5
    // Note potential overlap for 1,2,4,5. `originalContextHint` is crucial for disambiguation.

    // If the original context was APT, and the numerical label is one of the APT attack labels
    if (originalContextHint === 'APT' && [0, 1, 2, 4, 5].includes(numericalLabel)) {
        return 'APT';
    }
    // If the original context was DOS, and the numerical label is one of the DOS attack labels
    if (originalContextHint === 'DOS' && [1, 2, 3, 4, 5].includes(numericalLabel)) {
        return 'DOS';
    }

    // Handle generic 'Normal' from dropdown (which maps to DOS_NORMAL_LABEL_NUM) if passed
    if (numericalLabel === DOS_NORMAL_LABEL_NUM) return 'NORMAL_DOS';
    if (numericalLabel === APT_NORMAL_LABEL_NUM) return 'NORMAL_APT';


    // Fallback/Ambiguous cases:
    // If it's a number that exists in *both* APT and DOS attack types (e.g., 1, 2, 4, 5)
    // and `originalContextHint` was not definitive, or was 'Normal'.
    // For `userNewClassificationCategory`, we need to pick a primary context if ambiguous.
    // Based on `AttackTypeDropdown`'s mapping, if a generic 'Normal' (label 0) is chosen, it's DOS.
    // If there are other overlapping non-normal labels and the hint didn't resolve,
    // this might need a default or more complex mapping.
    // For now, if no clear context, it remains 'UNKNOWN' to be handled by the main logic's default.

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
            userattackType, // This is the new numerical classification provided by the user (number)
            originalLabel,
            originalAttackType,
            timestamp,
            flowDuration,
            sourceIP,
            destinationIP,
            protocol,
            srcPort,
            dstPort
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
        
        // Validate userattackType is a number
        if (typeof userattackType !== 'number' || isNaN(userattackType)) {
             return { success: false, message: `Invalid format for userattackType; expected a number, received "${userattackType}".` };
        }


        // 1. Fetch the original packet data from 'all_traffic_data' via 'common_data'
        console.log(`[FlagService] Fetching original packet data for common_data.id: ${packetId}, original type: ${originalAttackType}, label: ${originalMlLabelNum}`);
        const originalData: AllTrafficDataDbRow | null = await getOriginalTrafficData(
            parseInt(packetId),
            timestamp || '',
            flowDuration,
            sourceIP,
            destinationIP,
            protocol,
            srcPort,
            dstPort,
            originalAttackType,
            originalMlLabelNum
        );

        if (!originalData) {
            return { success: false, message: `Original packet with common_data.id ${packetId} not found in all_traffic_data.` };
        }

        // Determine the original context of the packet
        let originalContextCategory: 'APT' | 'DOS' | 'NORMAL_APT' | 'NORMAL_DOS' | 'UNKNOWN';
        if (originalAttackType === 'APT' || (originalAttackType === 'Normal' && originalMlLabelNum === APT_NORMAL_LABEL_NUM)) {
            originalContextCategory = 'APT';
        } else if (originalAttackType === 'DOS' || (originalAttackType === 'Normal' && originalMlLabelNum === DOS_NORMAL_LABEL_NUM)) {
            originalContextCategory = 'DOS';
        } else {
            originalContextCategory = 'UNKNOWN';
        }
        if (originalAttackType === 'Normal') { // Refine 'Normal' originalAttackType based on precise label
            if (originalMlLabelNum === APT_NORMAL_LABEL_NUM) originalContextCategory = 'NORMAL_APT';
            else if (originalMlLabelNum === DOS_NORMAL_LABEL_NUM) originalContextCategory = 'NORMAL_DOS';
            else originalContextCategory = 'UNKNOWN'; // Ambiguous normal label
        }

        // Determine the context of the user's NEW classification (using the numerical label)
        const userNewClassificationCategory = getNumericalLabelCategory(userattackType, originalAttackType as 'APT' | 'DOS' | 'Normal');

        const insertionPromises: Promise<void>[] = [];
        let finalMessage: string = `Packet ID ${packetId} successfully flagged.`;

        // Case 1: Original was APT-related
        if (originalContextCategory === 'APT' || originalContextCategory === 'NORMAL_APT') {
            // If user reclassifies as DOS-related (cross-classification)
            if (userNewClassificationCategory === 'DOS' || userNewClassificationCategory === 'NORMAL_DOS') {
                console.log(`[FlagService] Cross-classification: Original APT-related, User flagged as DOS-related (label ${userattackType}). Inserting into both flagged_apt (as Normal) and flag_traffic_dos.`);
                finalMessage = `Packet ID ${packetId} (originally APT-related) reclassified as DOS-related (label ${userattackType}). Marked Normal (${APT_NORMAL_LABEL_NUM}) for APT context.`;

                // --- INSERTION 1: INTO FLAGGED_APT (Original context is APT) ---
                //   Label: originalMlLabelNum (what it actually was)
                //   New_Label: APT_NORMAL_LABEL_NUM (it's now considered normal in APT context by user)
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum, // Always use originalMlLabelNum for 'Label' field in flagged_apt
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    APT_NORMAL_LABEL_NUM // New_Label for APT context is Normal (3)
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));

                // --- INSERTION 2: INTO FLAG_TRAFFIC_DOS (New context is DOS) ---
                //   label: DOS_NORMAL_LABEL_NUM (because originally it was NOT a DOS attack)
                //   new_label: userattackType (user's chosen DOS label)
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    DOS_NORMAL_LABEL_NUM, // Label field for DOS table becomes DOS Normal (0)
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    userattackType // User's specific numerical DOS label
                );
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));

            } else { // User reclassifies as APT-related, or Normal (APT Context)
                console.log(`[FlagService] Direct reclassification/Normal within APT context. Inserting into flagged_apt.`);
                finalMessage = `Packet ID ${packetId} (originally APT-related) reclassified as APT-related (label ${userattackType}).`;

                // --- INSERTION 1: INTO FLAGGED_APT (Direct reclassification) ---
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum, // Use the actual original ML label for this table
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    userattackType // User's new APT numerical label or APT Normal
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));
            }
        }
        // Case 2: Original was DOS-related
        else if (originalContextCategory === 'DOS' || originalContextCategory === 'NORMAL_DOS') {
            // If user reclassifies as APT-related (cross-classification)
            if (userNewClassificationCategory === 'APT' || userNewClassificationCategory === 'NORMAL_APT') {
                console.log(`[FlagService] Cross-classification: Original DOS-related, User flagged as APT-related (label ${userattackType}). Inserting into both flag_traffic_dos (as Normal) and flagged_apt.`);
                finalMessage = `Packet ID ${packetId} (originally DOS-related) reclassified as APT-related (label ${userattackType}). Marked Normal (${DOS_NORMAL_LABEL_NUM}) for DOS context.`;

                // --- INSERTION 1: INTO FLAG_TRAFFIC_DOS (Original context is DOS) ---
                //   label: originalMlLabelNum (what it actually was)
                //   new_label: DOS_NORMAL_LABEL_NUM (it's now considered normal in DOS context by user)
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum, // Always use originalMlLabelNum for 'label' field in flag_traffic_dos
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    DOS_NORMAL_LABEL_NUM // New_label for DOS context is Normal (0)
                );
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));

                // --- INSERTION 2: INTO FLAGGED_APT (New context is APT) ---
                //   Label: APT_NORMAL_LABEL_NUM (because originally it was NOT an APT attack)
                //   New_Label: userattackType (user's chosen APT label)
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    APT_NORMAL_LABEL_NUM, // Label field for APT table becomes APT Normal (3)
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    userattackType // User's specific APT numerical label
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));

            } else { // User reclassifies as DOS-related, or Normal (DOS Context)
                console.log(`[FlagService] Direct reclassification/Normal within DOS context. Inserting into flag_traffic_dos.`);
                finalMessage = `Packet ID ${packetId} (originally DOS-related) reclassified as DOS-related (label ${userattackType}).`;

                // --- INSERTION 1: INTO FLAG_TRAFFIC_DOS (Direct reclassification) ---
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum, // Use the actual original ML label for this table
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    userattackType // User's new DOS numerical label or DOS Normal
                );
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));
            }
        } else {
            // Fallback for cases where original context couldn't be determined (e.g., originalAttackType was UNKNOWN or 'Normal' but originalLabel was also ambiguous)
            // This attempts to insert based on the new classification's category.
            console.warn(`[FlagService] Original context (type: ${originalAttackType}, label: ${originalMlLabelNum}) could not be definitively determined. Attempting to flag based solely on new classification (label ${userattackType}).`);

            if (userNewClassificationCategory === 'APT' || userNewClassificationCategory === 'NORMAL_APT') {
                const aptDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum, // Pass original ML label as fallback
                    FLAGGED_APT_TARGET_COLUMN_NAMES,
                    userattackType // User's numerical label
                );
                insertionPromises.push(insertFlaggedTraffic('flagged_apt', aptDataForInsertion));
                finalMessage = `Packet ID ${packetId} flagged as APT-related (label ${userattackType}).`;
            } else if (userNewClassificationCategory === 'DOS' || userNewClassificationCategory === 'NORMAL_DOS' || userNewClassificationCategory === 'UNKNOWN') { // UNKNOWN defaults to DOS for flagging
                const dosDataForInsertion = prepareDataForFlaggedTable(
                    originalData,
                    originalAttackType,
                    originalMlLabelNum, // Pass original ML label as fallback
                    FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES,
                    userattackType // User's numerical label
                );
                dosDataForInsertion.created_at = new Date().toISOString();
                insertionPromises.push(insertFlaggedTraffic('flag_traffic_dos', dosDataForInsertion));
                finalMessage = `Packet ID ${packetId} flagged as DOS-related (label ${userattackType}).`;
            } else {
                 return { success: false, message: `Could not process flagging request: Unclear original or new classification context for numerical label ${userattackType}.` };
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