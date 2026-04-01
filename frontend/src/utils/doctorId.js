/**
 * Resolves which doctor ID to use for API calls.
 * Order: localStorage doctorInfo → VITE_DEFAULT_DOCTOR_ID → dev fallback (matches backend seed/dev).
 */
export const FALLBACK_DEV_DOCTOR_ID = '67e8a1b2c3d4e5f6a7b8c9d0';

export function getDoctorIdFromProfile() {
    try {
        const raw = localStorage.getItem('doctorInfo');
        if (!raw) return null;
        const doc = JSON.parse(raw);
        return doc._id || doc.id || null;
    } catch {
        return null;
    }
}

/**
 * @returns {{ id: string, source: 'profile' | 'env' | 'fallback' }}
 */
export function resolveDoctorIdForApi() {
    const fromProfile = getDoctorIdFromProfile();
    if (fromProfile) return { id: fromProfile, source: 'profile' };

    const envId = import.meta.env.VITE_DEFAULT_DOCTOR_ID;
    if (envId && String(envId).trim()) {
        return { id: String(envId).trim(), source: 'env' };
    }

    return { id: FALLBACK_DEV_DOCTOR_ID, source: 'fallback' };
}
