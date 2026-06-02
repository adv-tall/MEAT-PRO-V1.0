import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const formatGoogleSheet = async (spreadsheetId: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token. Please sign in with Google first.");

  // First, get the sheet ID of the first sheet (usually Sheet1)
  const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await getRes.json();
  if (!getRes.ok) throw new Error(data.error?.message || "Failed to fetch spreadsheet info");

  const sheetId = data.sheets[0].properties.sheetId;

  // We want to add some default headers: Date, Plan ID, Product, Issue, Status, etc.
  const headers = ["Date", "Plan ID", "Product", "Issue", "Status", "Note"];
  
  // Update header values
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:F1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [headers]
    })
  });

  // Apply formatting: freeze 1 row and highlight header #d0e0e3
  const batchUpdateRequest = {
    requests: [
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetId,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          fields: "gridProperties.frozenRowCount"
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 6
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 208 / 255, // #D0E0E3
                green: 224 / 255,
                blue: 227 / 255
              },
              textFormat: {
                bold: true
              }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)"
        }
      }
    ]
  };

  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(batchUpdateRequest)
  });

  if (!batchRes.ok) {
    const errorData = await batchRes.json();
    throw new Error(errorData.error?.message || "Failed to format spreadsheet");
  }

  return true;
};
