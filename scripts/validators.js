// Validation rules and regex assertions
export const REGEX = {
  description: /^\S+(?:\s\S+)*$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWords: /\b(\w+)\s+\1\b/i
};

export function validateTransaction(txn) {
  const errors = {};

  // Validate description
  if (!txn.description || txn.description.trim() === "") {
    errors.description = "Description is required.";
  } else if (!REGEX.description.test(txn.description)) {
    errors.description = "Description cannot have leading, trailing, or double spaces.";
  } else if (REGEX.duplicateWords.test(txn.description)) {
    const match = txn.description.match(REGEX.duplicateWords);
    errors.description = `Consecutive duplicate words are not allowed: "${match[1]}".`;
  }

  // Validate amount
  if (txn.amount === undefined || txn.amount === null || String(txn.amount).trim() === "") {
    errors.amount = "Amount is required.";
  } else {
    const amountStr = String(txn.amount).trim();
    if (!REGEX.amount.test(amountStr)) {
      errors.amount = "Amount must be a positive number (up to 2 decimal places, e.g., 45.50).";
    } else {
      const parsedAmount = parseFloat(amountStr);
      if (parsedAmount <= 0) {
        errors.amount = "Amount must be greater than 0.";
      }
    }
  }

  // Validate date
  if (!txn.date || txn.date.trim() === "") {
    errors.date = "Date is required.";
  } else if (!REGEX.date.test(txn.date)) {
    errors.date = "Date must be a valid calendar date in YYYY-MM-DD format.";
  } else {
    const parts = txn.date.split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      errors.date = "This calendar date does not exist (e.g. Feb 30).";
    }
  }

  // Validate category
  if (!txn.category || txn.category.trim() === "") {
    errors.category = "Category is required.";
  } else if (!REGEX.category.test(txn.category)) {
    errors.category = "Category must contain only letters, single spaces, or hyphens.";
  }

  // Determine validation status
  let isValid = true;
  if (errors.description || errors.amount || errors.date || errors.category) {
    isValid = false;
  }

  return {
    isValid: isValid,
    errors: errors
  };
}
