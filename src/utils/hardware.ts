export const getMachineId = async (): Promise<string> => {
    // Check if running in Electron and API is available
    if ((window as any).electronAPI && (window as any).electronAPI.getMachineId) {
        return (window as any).electronAPI.getMachineId();
    }

    // Fallback for Web/Dev: Generate or retrieve a UUID from localStorage
    const STORAGE_KEY = 'lan_center_machine_id';
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
};
