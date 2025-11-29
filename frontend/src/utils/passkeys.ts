import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import { passkeysApi, type User } from '../services/api';

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isPasskeySupported(): boolean {
  return (
    window?.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Register a new passkey for the authenticated user
 * @param deviceName Optional friendly name for the device
 * @returns Success status and any error message
 */
export async function registerPasskey(
  deviceName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check browser support
    if (!isPasskeySupported()) {
      return {
        success: false,
        error: 'Passkeys are not supported in this browser. Please use a modern browser.',
      };
    }

    // Get registration options from server
    const optionsResponse = await passkeysApi.getRegistrationOptions();
    if (!optionsResponse.success || !optionsResponse.data) {
      return {
        success: false,
        error: 'Failed to generate registration options. Please try again.',
      };
    }

    // Start registration with browser WebAuthn API
    let registrationResponse: RegistrationResponseJSON;
    try {
      registrationResponse = await startRegistration({ optionsJSON: optionsResponse.data });
    } catch (error) {
      // User cancelled or error during registration
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          return {
            success: false,
            error: 'Registration cancelled. Please try again when ready.',
          };
        }
        return {
          success: false,
          error: `Registration failed: ${error.message}`,
        };
      }
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }

    // Send registration response to server for verification
    const verificationResponse = await passkeysApi.verifyRegistration({
      response: registrationResponse,
      deviceName,
    });

    if (!verificationResponse.success) {
      return {
        success: false,
        error: verificationResponse.error || 'Registration verification failed.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Passkey registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Authenticate using a passkey
 * @param email User's email address
 * @returns Auth response with user and token, or error
 */
export async function authenticateWithPasskey(email: string): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    // Check browser support
    if (!isPasskeySupported()) {
      return {
        success: false,
        error: 'Passkeys are not supported in this browser.',
      };
    }

    // Get authentication options from server
    const optionsResponse = await passkeysApi.getAuthenticationOptions(email);
    if (!optionsResponse.success || !optionsResponse.data) {
      return {
        success: false,
        error: optionsResponse.message || 'No passkeys found for this email.',
      };
    }

    // Start authentication with browser WebAuthn API
    let authenticationResponse: AuthenticationResponseJSON;
    try {
      authenticationResponse = await startAuthentication({ optionsJSON: optionsResponse.data });
    } catch (error) {
      // User cancelled or error during authentication
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          return {
            success: false,
            error: 'Authentication cancelled.',
          };
        }
        return {
          success: false,
          error: `Authentication failed: ${error.message}`,
        };
      }
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }

    // Send authentication response to server for verification
    const verificationResponse = await passkeysApi.verifyAuthentication({
      response: authenticationResponse,
      email,
    });

    if (!verificationResponse.success || !verificationResponse.data) {
      return {
        success: false,
        error: verificationResponse.error || 'Authentication verification failed.',
      };
    }

    return {
      success: true,
      user: verificationResponse.data.user,
      token: verificationResponse.data.token,
    };
  } catch (error) {
    console.error('Passkey authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get browser/device name for display purposes
 */
export function getBrowserDeviceName(): string {
  const ua = navigator.userAgent;

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  return `${browser} on ${os}`;
}
