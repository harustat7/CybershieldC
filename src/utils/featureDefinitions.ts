// // src/utils/featureDefinitions.ts

// import {
//     AllTrafficDataDbRow, // The new definitive source for original data
//     FlaggedAptTargetDbRow, FlagTrafficDosTargetDbRow
// } from '../types';

// export const FLAGGED_APT_TARGET_COLUMN_NAMES = Object.keys({} as FlaggedAptTargetDbRow);
// export const FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES = Object.keys({} as FlagTrafficDosTargetDbRow);


// /**
//  * Maps and filters a raw database row (from AllTrafficDataDbRow)
//  * into the required schema for a target flagged table.
//  * This is where all the column name and type inconsistencies are resolved.
//  *
//  * @param originalRowData The raw row object fetched from the AllTrafficDataDbRow table.
//  * @param originalAttackType The broad attack type of the original packet ('APT', 'DOS', 'Normal').
//  * @param originalMlLabelNum The numerical label (e.g., 0, 1, 3) from NetworkPacket.label.
//  * @param targetColumnNames An array of column names expected by the target flagged table.
//  * @param userNewLabelString The comprehensive new label provided by the user (e.g., "APT-Pivoting").
//  * @returns An object ready for insertion into the target Supabase flagged table.
//  */
// export function prepareDataForFlaggedTable(
//     originalRowData: AllTrafficDataDbRow, // Now explicitly AllTrafficDataDbRow
//     originalAttackType: string | null,
//     originalMlLabelNum: number,
//     targetColumnNames: string[],
//     userNewLabelString: string
// ): Record<string, any> {
//     const dataToInsert: Record<string, any> = {};

//     // Helper to determine if the target is an APT-related flagged table
//     // This logic is still based on the original ML classification, which dictates the target flagged table schema.
//     const isTargetAptFlaggedTable = (originalAttackType === 'APT' || (originalAttackType === 'Normal' && originalMlLabelNum !== 0));
//     // Helper to determine if the target is a DOS-related flagged table
//     const isTargetDosFlaggedTable = (originalAttackType === 'DOS' || (originalAttackType === 'Normal' && originalMlLabelNum === 0));

//     for (const targetCol of targetColumnNames) {
//         let sourceValue: any = null; // Default to null for safety

//         // --- Handle Special Columns (Old/New Labels, Flagging Timestamp) ---
//         if (targetCol === 'Label' && isTargetAptFlaggedTable) {
//             // flagged_apt uses 'Label' (uppercase) for old label
//             sourceValue = originalMlLabelNum;
//         } else if (targetCol === 'label' && isTargetDosFlaggedTable) {
//             // flag_traffic_dos uses 'label' (lowercase) for old label
//             sourceValue = originalMlLabelNum;
//         } else if (targetCol === 'New_Label' || targetCol === 'new_label') {
//             sourceValue = userNewLabelString;
//         } else if (targetCol === 'created_at' && targetColumnNames === FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES) {
//             continue; // Skip, API will set this as flagging event time
//         }
//         // --- Handle Mapping from AllTrafficDataDbRow ---
//         // AllTrafficDataDbRow is comprehensive and its column names generally align with target flagged tables.
//         // We will prioritize direct mapping and then handle specific discrepancies if any.
//         else {
//             // Try to directly map from originalRowData (which is AllTrafficDataDbRow)
//             if (originalRowData.hasOwnProperty(targetCol)) {
//                 sourceValue = originalRowData[targetCol as keyof AllTrafficDataDbRow];
//             } else {
//                 // This 'else' block (switch statement) is for fields that exist in the target
//                 // but might have a *different name* in AllTrafficDataDbRow.
//                 // However, based on your schemas, AllTrafficDataDbRow is designed to have the 'unified' names
//                 // that match the target flagged tables, simplifying this greatly.
//                 // Therefore, this switch statement becomes much smaller, only handling edge cases
//                 // if they arise, or can largely be removed if there are no such discrepancies
//                 // between AllTrafficDataDbRow and the target flagged table column names.

//                 // Example: If AllTrafficDataDbRow had 'fwd_bytes_per_second' but target expected 'flow_byts_s',
//                 // you'd put that mapping here. But AllTrafficDataDbRow already has 'flow_byts_s'.

//                 // Given AllTrafficDataDbRow's comprehensive nature and matching naming to flagged tables,
//                 // most fields should hit the `originalRowData.hasOwnProperty(targetCol)` condition above.
//                 // This default case correctly sets to null if a column is missing.
//                 sourceValue = null;
//             }
//         }
//         dataToInsert[targetCol] = sourceValue;
//     }

//     return dataToInsert;
// }


// src/utils/featureDefinitions.ts

import {
    AllTrafficDataDbRow, // The new definitive source for original data
    FlaggedAptTargetDbRow, FlagTrafficDosTargetDbRow
} from '../types';

export const FLAGGED_APT_TARGET_COLUMN_NAMES = Object.keys({} as FlaggedAptTargetDbRow);
export const FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES = Object.keys({} as FlagTrafficDosTargetDbRow);


/**
 * Maps and filters a raw database row (from AllTrafficDataDbRow)
 * into the required schema for a target flagged table.
 * This is where all the column name and type inconsistencies are resolved.
 *
 * @param originalRowData The raw row object fetched from the AllTrafficDataDbRow table.
 * @param originalAttackType The broad attack type of the original packet ('APT', 'DOS', 'Normal') - KEPT FOR CONSISTENCY, NOT USED FOR TARGET TYPE INFERENCE.
 * @param originalLabelForTargetTable The numerical label to be inserted into the target table's 'Label'/'label' column. This will be the original ML label for same-context reclassifications, or a derived 'Normal' label for cross-classification.
 * @param targetColumnNames An array of column names expected by the target flagged table.
 * @param userNewLabelNum The comprehensive new numerical label provided by the user (e.g., 0, 1, 3).
 * @returns An object ready for insertion into the target Supabase flagged table.
 */
export function prepareDataForFlaggedTable(
    originalRowData: AllTrafficDataDbRow,
    originalAttackType: string | null, // Kept for consistency, not used for target type inference
    originalLabelForTargetTable: number, // CHANGED: Parameter name and type
    targetColumnNames: string[],
    userNewLabelNum: number // CHANGED: Parameter name and type
): Record<string, any> {
    const dataToInsert: Record<string, any> = {};

    // Determine target table type directly from targetColumnNames for mapping logic
    const isTargetAptTable = targetColumnNames === FLAGGED_APT_TARGET_COLUMN_NAMES;
    const isTargetDosTable = targetColumnNames === FLAG_TRAFFIC_DOS_TARGET_COLUMN_NAMES;

    for (const targetCol of targetColumnNames) {
        let sourceValue: any = null; // Default to null for safety

        // --- Handle Special Columns (Old/New Labels, Flagging Timestamp) ---
        // Handle 'Label' (for flagged_apt) or 'label' (for flag_traffic_dos)
        if (targetCol === 'Label' && isTargetAptTable) {
            sourceValue = originalLabelForTargetTable;
        } else if (targetCol === 'label' && isTargetDosTable) {
            sourceValue = originalLabelForTargetTable;
        }
        // Handle 'New_Label' (for flagged_apt) or 'new_label' (for flag_traffic_dos)
        else if (targetCol === 'New_Label' || targetCol === 'new_label') {
            sourceValue = userNewLabelNum;
        }
        // Handle 'created_at' specifically for flag_traffic_dos (it's set by API, not mapped here)
        else if (targetCol === 'created_at' && isTargetDosTable) {
            continue; // Skip this column; it will be set by flagService.ts as the flagging timestamp
        }
        // --- Handle Mapping from AllTrafficDataDbRow (the comprehensive source) ---
        // Direct mapping for other fields from AllTrafficDataDbRow
        else if (originalRowData.hasOwnProperty(targetCol)) {
            sourceValue = originalRowData[targetCol as keyof AllTrafficDataDbRow];
        }
        // Default to null if the column is not found in AllTrafficDataDbRow and no specific mapping
        else {
            sourceValue = null;
        }
        dataToInsert[targetCol] = sourceValue;
    }

    return dataToInsert;
}