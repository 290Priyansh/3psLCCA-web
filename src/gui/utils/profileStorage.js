// Profile storage utility - mimics desktop's data/user_db/profile.json
const STORAGE_KEY = 'agencyProfiles';
const ACTIVE_PROFILE_KEY = 'activeAgencyProfile';

export const getProfiles = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

export const saveProfile = (profileName, data) => {
    const profiles = getProfiles();
    profiles[profileName] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    // Also save as active
    setActiveProfile({ ...data, profile_name: profileName });
    return true;
};

export const deleteProfile = (profileName) => {
    const profiles = getProfiles();
    if (profileName in profiles) {
        delete profiles[profileName];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
        return true;
    }
    return false;
};

export const getActiveProfile = () => {
    try {
        const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const setActiveProfile = (data) => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(data));
};
