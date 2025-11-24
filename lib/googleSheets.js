import { google } from 'googleapis';

const getAuthClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
};
console.log("EMAIL:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("PRIVATE KEY EXISTS:", Boolean(process.env.GOOGLE_PRIVATE_KEY));
console.log("SPREADSHEET ID:", process.env.SPREADSHEET_ID);


const getSheets = async () => {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
};

export const getSheetData = async (sheetName, range = 'A:Z') => {
  try {
    const sheets = await getSheets();
    const formattedSheetName = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${formattedSheetName}!${range}`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    const headers = rows[0];
    const data = rows.slice(1).map((row, index) => {
      const obj = { _rowIndex: index + 2 }; // +2 karena header di row 1
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      return obj;
    });

    return data;
  } catch (error) {
    console.error('Error getting sheet data:', error);
    throw error;
  }
};

// Tambah data ke sheet
export const appendSheetData = async (sheetName, values) => {
  try {
    const sheets = await getSheets();
    const formattedSheetName = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${formattedSheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error appending sheet data:', error);
    throw error;
  }
};

// Update data di sheet
export const updateSheetData = async (sheetName, rowIndex, values) => {
  try {
    const sheets = await getSheets();
    const formattedSheetName = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${formattedSheetName}!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating sheet data:', error);
    throw error;
  }
};

// Hapus data
export const deleteSheetRow = async (sheetName, rowIndex) => {
  try {
    const sheets = await getSheets();
    const formattedSheetName = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${formattedSheetName}!A${rowIndex}:Z${rowIndex}`,
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting sheet row:', error);
    throw error;
  }
};

// Update stock
export const updateStock = async (itemName, quantityChange) => {
  try {
    const stocks = await getSheetData('Stock');
    const stock = stocks.find(s => s.item_name === itemName);
    
    if (!stock) {
      throw new Error(`Item "${itemName}" tidak ditemukan di Stock`);
    }

    const currentStock = parseInt(stock.quantity) || 0;
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      throw new Error(`Stock tidak cukup untuk item "${itemName}". Stock tersedia: ${currentStock}`);
    }

    const updatedAt = new Date().toISOString();
    
    await updateSheetData('Stock', stock._rowIndex, [
      itemName,
      newStock,
      updatedAt
    ]);

    return { itemName, oldStock: currentStock, newStock, updatedAt };
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Find user by username
export const findUserByUsername = async (username) => {
  try {
    const users = await getSheetData('Users');
    return users.find(u => u.username === username);
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};