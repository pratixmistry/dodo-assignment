export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export interface FormValues {
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export interface FormErrors {
  email?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
}

export function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email.";
  }

  const cardDigits = values.cardNumber.replace(/\D/g, "");
  if (cardDigits.length < 13 || cardDigits.length > 19) {
    errors.cardNumber = "Card number looks too short.";
  } else if (!luhnValid(cardDigits)) {
    errors.cardNumber = "That card number doesn't look valid.";
  }

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(values.expiry);
  if (!expiryMatch) {
    errors.expiry = "Use MM/YY.";
  } else {
    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    const now = new Date();
    const expiryDate = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12) {
      errors.expiry = "Enter a valid month.";
    } else if (expiryDate < now) {
      errors.expiry = "Card has expired.";
    }
  }

  if (!/^\d{3,4}$/.test(values.cvc)) {
    errors.cvc = "3 or 4 digits.";
  }

  return errors;
}
