export const GLOSSARY: Record<string, string> = {
  "Intraday Trading":
    "Buying and selling stocks within the same day. You don't hold anything overnight.",
  "Entry Price":
    "The price at which you bought or sold a stock to start a trade.",
  "Exit Price":
    "The price at which you closed your trade by selling (if you bought) or buying back (if you sold).",
  "Target Price":
    "The price you hope the stock reaches so you can take your profit. Set this before entering a trade.",
  "Stop Loss":
    "A safety price where you exit the trade to limit your loss. Like a seatbelt for your money.",
  "P&L":
    "Profit and Loss — the money you made or lost on a trade. Green means profit, red means loss.",
  "Unrealized P&L":
    "Profit or loss on a trade you haven't closed yet. It changes with the stock's live price.",
  "Win Rate":
    "The percentage of your trades that made a profit. 60% win rate means 6 out of 10 trades were profitable.",
  "Risk/Reward Ratio":
    "Compares how much you can lose vs. how much you can gain. A 1:2 ratio means you risk ₹100 to potentially gain ₹200.",
  Side: "Whether you are buying (BUY) or selling (SELL) the stock to start the trade.",
  Quantity: "The number of shares you are buying or selling in a trade.",
  "BUY (Long)":
    "You buy first and sell later, hoping the price goes up. You profit when the price rises.",
  "SELL (Short)":
    "You sell first and buy later, hoping the price goes down. You profit when the price falls.",
  "Position Size":
    "How many shares to buy based on your capital and how much you're willing to risk.",
  Exchange:
    "The stock market where the trade happens — NSE (National Stock Exchange) or BSE (Bombay Stock Exchange).",
  "Daily Loss Limit":
    "The maximum amount you're willing to lose in a single day. Stop trading when you hit this.",
  Capital:
    "The total money you have set aside for trading. Never risk more than you can afford to lose.",
  Broker:
    "The company through which you buy and sell stocks (e.g., Groww, Zerodha).",
  Emotion:
    "How you felt during a trade. Tracking emotions helps you spot patterns in impulsive decisions.",
  "Avg. Profit":
    "The average amount you make on your winning trades.",
  "Avg. Loss":
    "The average amount you lose on your losing trades.",
  Confidence:
    "How certain the AI is about its suggestion. HIGH means very confident, LOW means it's less sure.",
  Holdings:
    "Stocks you currently own and haven't sold yet. These are your open positions.",
  "Stock Holdings":
    "Stocks you bought and plan to hold for days, weeks, or years. Unlike intraday, you don't sell on the same day.",
  "Delivery Trading":
    "When you buy a stock and keep it beyond the trading day. The stock is 'delivered' to your demat account.",
  "Average Buy Price":
    "If you bought a stock in multiple batches at different prices, this is the weighted average of all your purchases.",
  Portfolio:
    "Your collection of all investments — stocks, mutual funds, and intraday trades combined.",
  "Mutual Fund":
    "A pool of money collected from many investors, managed by professionals who invest it in stocks, bonds, or other assets.",
  "NAV (Net Asset Value)":
    "The price of one unit of a mutual fund. It changes daily based on how the fund's investments perform.",
  "SIP (Systematic Investment Plan)":
    "Investing a fixed amount in a mutual fund every month automatically. Great for building wealth slowly over time.",
  Units:
    "When you invest in a mutual fund, you get 'units' based on the NAV. More units = more investment.",
  XIRR:
    "A way to measure your actual returns accounting for when you invested. More accurate than simple percentage returns.",
  ELSS:
    "Equity Linked Savings Scheme — a type of mutual fund that saves you tax (up to ₹1.5 lakh under Section 80C) but locks your money for 3 years.",
  "Expense Ratio":
    "The annual fee a mutual fund charges for managing your money. Lower is better — usually 0.5% to 2.5%.",
  "Folio Number":
    "A unique ID for your mutual fund investment. Like a bank account number, but for your fund.",
  "Equity Fund":
    "A mutual fund that invests mainly in stocks. Higher risk but potentially higher returns over the long term.",
  "Debt Fund":
    "A mutual fund that invests in bonds and fixed-income securities. Lower risk, steadier returns.",
  "Hybrid Fund":
    "A mutual fund that invests in both stocks and bonds. A middle ground between equity and debt funds.",
  "LTCG (Long Term Capital Gains)":
    "Tax on profits from selling stocks/equity funds held for more than 1 year. Currently 10% above ₹1 lakh.",
  "STCG (Short Term Capital Gains)":
    "Tax on profits from selling stocks/equity funds held for less than 1 year. Currently 15%.",
};

export function getDefinition(term: string): string | undefined {
  // Try exact match first, then case-insensitive
  return (
    GLOSSARY[term] ||
    Object.entries(GLOSSARY).find(
      ([key]) => key.toLowerCase() === term.toLowerCase()
    )?.[1]
  );
}
