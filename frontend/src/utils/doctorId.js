/**
 * Doctor ID Management - No localStorage or default IDs
 * Only uses valid registered doctor IDs from backend
 */

// Cache for valid doctors to avoid repeated API calls
let doctorsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all valid registered doctors from backend
 * @returns {Promise<Array>} Array of doctor objects with _id, name, email, specialty
 */
export async function fetchValidDoctors() {
    try {
        // Check cache first
        const now = Date.now();
        if (doctorsCache && (now - cacheTimestamp) < CACHE_DURATION) {
            return doctorsCache;
        }

        const response = await fetch('/api/doctors', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch doctors: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.doctors) {
            doctorsCache = data.doctors;
            cacheTimestamp = now;
            return doctorsCache;
        } else {
            throw new Error(data.message || 'Invalid response from server');
        }
    } catch (error) {
        console.error('Error fetching valid doctors:', error);
        throw error;
    }
}

/**
 * Validate if a doctor ID exists in the registered doctors
 * @param {string} doctorId - The doctor ID to validate
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function validateDoctorId(doctorId) {
    if (!doctorId || typeof doctorId !== 'string') {
        return false;
    }

    try {
        const doctors = await fetchValidDoctors();
        return doctors.some(doctor => doctor._id === doctorId);
    } catch (error) {
        console.error('Error validating doctor ID:', error);
        return false;
    }
}

/**
 * Get doctor by ID from registered doctors
 * @param {string} doctorId - The doctor ID to fetch
 * @returns {Promise<Object|null>} Doctor object if found, null otherwise
 */
export async function getDoctorById(doctorId) {
    if (!doctorId) {
        return null;
    }

    try {
        const doctors = await fetchValidDoctors();
        return doctors.find(doctor => doctor._id === doctorId) || null;
    } catch (error) {
        console.error('Error getting doctor by ID:', error);
        return null;
    }
}

/**
 * Resolve doctor ID for API calls - NO DEFAULTS OR FALLBACKS
 * Must provide a valid doctor ID
 * @param {string} providedDoctorId - The doctor ID to use
 * @returns {Promise<{id: string, source: 'provided'}>}
 */
export async function resolveDoctorIdForApi(providedDoctorId) {
    // Must provide a doctor ID
    if (!providedDoctorId) {
        throw new Error('Doctor ID is required. Please provide a valid doctor ID from registered doctors.');
    }

    // Validate the provided doctor ID
    const isValid = await validateDoctorId(providedDoctorId);
    if (isValid) {
        return { id: providedDoctorId, source: 'provided' };
    } else {
        throw new Error(`Invalid doctor ID: ${providedDoctorId}. Doctor not found in registered doctors.`);
    }
}

/**
 * Clear the doctors cache (useful for testing or when doctors are updated)
 */
export function clearDoctorsCache() {
    doctorsCache = null;
    cacheTimestamp = 0;
}

/**
 * Get doctors for selection UI (filtered and formatted)
 * @returns {Promise<Array<{value: string, label: string, specialty: string, email: string}>}>}
 */
export async function getDoctorsForSelection() {
    try {
        const doctors = await fetchValidDoctors();
        return doctors.map(doctor => ({
            value: doctor._id,
            label: `Dr. ${doctor.name}`,
            specialty: doctor.specialty || 'General Practice',
            email: doctor.email,
            status: doctor.status
        }));
    } catch (error) {
        console.error('Error getting doctors for selection:', error);
        return [];
    }
}

/**
 * Get first available doctor (for fallback when no doctor is selected)
 * @returns {Promise<string|null>} First doctor ID or null if no doctors
 */
export async function getFirstAvailableDoctor() {
    try {
        const doctors = await fetchValidDoctors();
        return doctors.length > 0 ? doctors[0]._id : null;
    } catch (error) {
        console.error('Error getting first available doctor:', error);
        return null;
    }
}
