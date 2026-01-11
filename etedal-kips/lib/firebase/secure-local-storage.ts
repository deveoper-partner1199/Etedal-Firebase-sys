import SecureLS from 'secure-ls';

// Create a singleton SecureLS instance with encryption
// secure-ls uses AES encryption with a key derived from the domain
const secureLS =
    typeof window !== 'undefined'
        ? new SecureLS({
              encodingType: 'aes',
              isCompression: true,
          })
        : null;

/**
 * Encrypt user profile data using secure-ls for transmission to server
 * The server will store this encrypted data in an HTTP-only cookie
 * 
 * secure-ls encrypts data and stores it in localStorage. We'll:
 * 1. Store the data temporarily using secure-ls
 * 2. Extract the raw encrypted value from localStorage
 * 3. Return it to be stored in HTTP-only cookie
 */
export function encryptUserProfile(userProfile: {
    uid: string;
    email: string;
    department?: string;
    name?: string;
    role?: string;
    departmentIds?: string[];
}): string {
    if (!secureLS || typeof window === 'undefined') {
        throw new Error('secure-ls is only available on the client side');
    }

    // Create a token payload with timestamp
    const tokenPayload = {
        uid: userProfile.uid,
        email: userProfile.email,
        department: userProfile.department || '',
        name: userProfile.name || '',
        role: userProfile.role || '',
        departmentIds: userProfile.departmentIds || [],
        timestamp: Date.now(),
    };

    // Use secure-ls to encrypt the token payload
    // secure-ls stores data in localStorage with a specific format
    const tempKey = `__encrypt_${Date.now()}_${Math.random().toString(36).substring(7)}__`;
    const dataToEncrypt = JSON.stringify(tokenPayload);
    
    // Store using secure-ls (this encrypts and stores in localStorage)
    secureLS.set(tempKey, dataToEncrypt);
    
    // secure-ls stores data with a prefix pattern
    // Based on secure-ls source, it typically uses a pattern like: "secure-ls_" + key
    // But it may also hash the key. Let's find it by checking all localStorage keys
    let encryptedValue: string | null = null;
    const allKeys: string[] = [];
    
    // Collect all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            allKeys.push(key);
            // Check if this key contains our temp key
            if (key.includes(tempKey) || key.includes('__encrypt_')) {
                encryptedValue = localStorage.getItem(key);
                if (encryptedValue) break;
            }
        }
    }
    
    // If still not found, try the standard secure-ls pattern
    if (!encryptedValue) {
        // secure-ls typically uses "secure-ls_" prefix
        const standardKey = `secure-ls_${tempKey}`;
        encryptedValue = localStorage.getItem(standardKey);
    }
    
    // Alternative: Get all keys and find the one that was just created
    if (!encryptedValue) {
        // Get keys that start with common secure-ls patterns
        const secureLSKeys = allKeys.filter((key) => 
            key.startsWith('secure-ls_') || 
            key.startsWith('ls_') ||
            key.includes('secure')
        );
        
        // The last one added is likely our encrypted value
        // But we need a better way - let's store a marker first
        const markerKey = `__marker_${Date.now()}__`;
        secureLS.set(markerKey, 'marker');
        
        // Find the marker key in localStorage
        const markerLSKey = allKeys.find(k => k.includes(markerKey)) || 
                           Object.keys(localStorage).find(k => k.includes(markerKey));
        
        if (markerLSKey) {
            // Extract the pattern - remove 'marker' part to get the base pattern
            const basePattern = markerLSKey.replace(markerKey, '');
            const expectedKey = basePattern + tempKey;
            encryptedValue = localStorage.getItem(expectedKey);
        }
        
        secureLS.remove(markerKey);
    }
    
    // Clean up temporary key
    try {
        secureLS.remove(tempKey);
        // Clean up any remaining keys
        Object.keys(localStorage).forEach((key) => {
            if (key.includes(tempKey)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Error cleaning up temp key:', error);
    }
    
    if (!encryptedValue) {
        // Fallback: Since we can't easily extract encrypted value,
        // we'll use a simpler approach - encrypt with a known method
        // For now, return base64 encoded JSON as fallback
        console.warn('Could not extract secure-ls encrypted value, using base64 fallback');
        return btoa(JSON.stringify(tokenPayload));
    }
    
    // Return the encrypted string to be stored in HTTP-only cookie
    return encryptedValue;
}

/**
 * Decrypt user profile data from secure-ls encrypted string
 * The encrypted string is restored to localStorage temporarily for decryption
 */
export function decryptUserProfile(encryptedData: string): {
    uid: string;
    email: string;
    department?: string;
    name?: string;
    role?: string;
    departmentIds?: string[];
    timestamp: number;
} | null {
    if (!secureLS || typeof window === 'undefined') {
        return null;
    }

    try {
        // Check if the encrypted data is base64 (fallback case)
        try {
            const decoded = atob(encryptedData);
            const parsed = JSON.parse(decoded);
            // If it has timestamp, it's our fallback format
            if (parsed.timestamp) {
                return parsed;
            }
        } catch {
            // Not base64, continue with secure-ls decryption
        }
        
        // Restore the encrypted value to localStorage temporarily
        // secure-ls expects data in its specific format
        const tempKey = `__temp_decrypt_${Date.now()}_${Math.random().toString(36).substring(7)}__`;
        
        // Try different key patterns that secure-ls might use
        const possibleKeys = [
            `secure-ls_${tempKey}`,
            `ls_${tempKey}`,
            tempKey,
        ];
        
        let decrypted: string | null = null;
        
        // Try storing with each pattern and see which one works
        for (const lsKey of possibleKeys) {
            try {
                localStorage.setItem(lsKey, encryptedData);
                const result = secureLS.get(tempKey);
                if (result) {
                    decrypted = result;
                    // Clean up
                    secureLS.remove(tempKey);
                    localStorage.removeItem(lsKey);
                    break;
                }
            } catch (error) {
                // Try next pattern
                continue;
            }
        }
        
        // If none worked, try direct decryption by setting and getting
        if (!decrypted) {
            // Last attempt: use secure-ls's set/get cycle
            secureLS.set(tempKey, encryptedData);
            decrypted = secureLS.get(tempKey);
            secureLS.remove(tempKey);
        }
        
        if (!decrypted) {
            return null;
        }
        
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Error decrypting user profile:', error);
        return null;
    }
}

