// src/supabase/db_queries.ts

import { createClient } from '@supabase/supabase-js';
import {
  AllTrafficDataDbRow, // Explicitly import AllTrafficDataDbRow for the final fetch
  CommonDataDbRow // Import CommonDataDbRow to fetch the FK
} from './../src/types/index'; // Corrected import path and removed unused individual OriginalDbRow types

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches a single traffic data row from the `all_traffic_data` table
 * by first querying `common_data` using frontend packet ID, then using the
 * foreign key to get the full details.
 *
 * @param packetId The unique ID of the packet from `common_data` (frontend's NetworkPacket.id).
 * @param eventTimestamp The network event timestamp for the packet (from frontend's NetworkPacket.time, used as filter for common_data).
 * @param flowDuration The flow duration for the packet (used as filter for common_data).
 * @param sourceIP The source IP address (used as filter for common_data).
 * @param destinationIPFromFrontend The destination IP address (from frontend's NetworkPacket.destinationIP, used as filter for common_data).
 * @param protocol The network protocol (used as filter for common_data).
 * @param srcPort The source port (used as filter for common_data).
 * @param dstPortFromFrontend The destination port (from frontend's NetworkPacket.dstPort, used as filter for common_data).
 * @param originalAttackType The broad original ML classification ('APT', 'DOS', 'Normal') - NOT USED FOR FETCHING HERE, ONLY PASSED FOR CONSISTENCY.
 * @param originalMlLabelNum The original ML numerical label (e.g., 0, 1, 3) - NOT USED FOR FETCHING HERE, ONLY PASSED FOR CONSISTENCY.
 * @returns The matching AllTrafficDataDbRow or null if not found.
 */
export async function getOriginalTrafficData(
  packetId: number,
  eventTimestamp: string,
  flowDuration: number,
  sourceIP: string,
  destinationIPFromFrontend: string,
  protocol: string,
  srcPort: number,
  dstPortFromFrontend: number,
  originalAttackType: string | null, // Kept for consistency with caller, not used for table selection
  originalMlLabelNum: number // Kept for consistency with caller, not used for table selection
): Promise<AllTrafficDataDbRow | null> {
  // Step 1: Fetch the common_data row to get the all_traffic_data_id
  const { data: commonDataRows, error: commonDataError } = await supabase
    .from('common_data')
    .select('id, all_traffic_data_id, time, src_ip, dest_ip, protocol, src_port, dst_port, flow_duration, label, attack_type') // Select required columns, including the new FK
    .eq('id', packetId)
    .eq('time', eventTimestamp) // Using common_data's 'time' column
    .eq('flow_duration', flowDuration)
    .eq('src_ip', sourceIP)
    .eq('dest_ip', destinationIPFromFrontend) // common_data uses 'dest_ip'
    .eq('protocol', protocol)
    .eq('src_port', srcPort)
    .eq('dst_port', dstPortFromFrontend) // common_data uses 'dst_port'
    .limit(1);

  if (commonDataError) {
    console.error(`Supabase Error fetching from common_data:`, commonDataError.message);
    throw new Error(`Database error fetching from common_data: ${commonDataError.message}`);
  }

  if (!commonDataRows || commonDataRows.length === 0) {
    console.warn(`Common data row with ID ${packetId} not found.`);
    return null;
  }

  const commonDataRow: CommonDataDbRow = commonDataRows[0];
  const allTrafficDataId = commonDataRow.all_traffic_data_id;

  if (!allTrafficDataId) {
    console.error(`all_traffic_data_id not found in common_data row for packet ID ${packetId}.`);
    return null;
  }

  // Step 2: Use all_traffic_data_id to fetch the full details from all_traffic_data
  const { data: allTrafficDataRows, error: allTrafficDataError } = await supabase
    .from('all_traffic_data')
    .select('*') // Select all columns for the full packet details
    .eq('id', allTrafficDataId) // Query using the foreign key
    .limit(1);

  if (allTrafficDataError) {
    console.error(`Supabase Error fetching from all_traffic_data:`, allTrafficDataError.message);
    throw new Error(`Database error fetching from all_traffic_data: ${allTrafficDataError.message}`);
  }

  if (allTrafficDataRows && allTrafficDataRows.length > 0) {
    return allTrafficDataRows[0] as AllTrafficDataDbRow; // Return the full data row
  }

  console.warn(`Full traffic data row not found in all_traffic_data for ID ${allTrafficDataId}.`);
  return null;
}

/**
 * Inserts a prepared data object into the specified flagged table.
 *
 * @param tableName The name of the target flagged table ('flagged_apt' or 'flag_traffic_dos').
 * @param dataToInsert An object where keys are column names and values are the data to insert.
 * @returns void if successful, throws an error otherwise.
 */
export async function insertFlaggedTraffic(
  tableName: 'flagged_apt' | 'flag_traffic_dos',
  dataToInsert: Record<string, any> // Object with column_name: value, already prepared by mapping
): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .insert([dataToInsert]);

  if (error) {
    console.error(`Supabase Error inserting into ${tableName}:`, error.message);
    throw new Error(`Failed to insert flagged traffic into ${tableName}. Details: ${error.message}`);
  }
}