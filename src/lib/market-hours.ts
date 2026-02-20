const IST_OFFSET = 5.5 * 60; // IST is UTC+5:30

export function getISTDate(date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET * 60000);
}

/** Returns a Date representing midnight IST today (as a UTC timestamp) */
export function getISTMidnight(date = new Date()): Date {
  const ist = getISTDate(date);
  ist.setHours(0, 0, 0, 0);
  // Convert IST midnight back to UTC
  return new Date(ist.getTime() - IST_OFFSET * 60000);
}

export function isMarketOpen(date = new Date()): boolean {
  const ist = getISTDate(date);
  const day = ist.getDay();

  // Weekdays only (Mon=1 to Fri=5)
  if (day === 0 || day === 6) return false;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Market hours: 9:15 AM to 3:30 PM IST
  const marketOpen = 9 * 60 + 15; // 555
  const marketClose = 15 * 60 + 30; // 930

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

export function isMarketDay(date = new Date()): boolean {
  const ist = getISTDate(date);
  const day = ist.getDay();
  return day >= 1 && day <= 5;
}

export function getMarketStatus(date = new Date()): {
  isOpen: boolean;
  message: string;
  nextEvent: string;
} {
  const ist = getISTDate(date);
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;
  const marketClose = 15 * 60 + 30;

  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      message: "Market Closed",
      nextEvent: day === 6 ? "Opens Monday 9:15 AM" : "Opens tomorrow 9:15 AM",
    };
  }

  if (timeInMinutes < marketOpen) {
    const minsUntil = marketOpen - timeInMinutes;
    const h = Math.floor(minsUntil / 60);
    const m = minsUntil % 60;
    return {
      isOpen: false,
      message: "Market Closed",
      nextEvent: `Opens in ${h > 0 ? `${h}h ` : ""}${m}m`,
    };
  }

  if (timeInMinutes > marketClose) {
    return {
      isOpen: false,
      message: "Market Closed",
      nextEvent: day === 5 ? "Opens Monday 9:15 AM" : "Opens tomorrow 9:15 AM",
    };
  }

  const minsUntilClose = marketClose - timeInMinutes;
  const h = Math.floor(minsUntilClose / 60);
  const m = minsUntilClose % 60;
  return {
    isOpen: true,
    message: "Market Open",
    nextEvent: `Closes in ${h > 0 ? `${h}h ` : ""}${m}m`,
  };
}
