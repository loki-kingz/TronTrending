import dotenv from "dotenv";

export const { NODE_ENV } = process.env;
dotenv.config({
  path: NODE_ENV === "development" ? ".env" : ".env.production",
});

export const {
  BOT_TOKEN,
  BOT_USERNAME,
  FIREBASE_PREFIX,
  DEX_URL,
  FIREBASE_KEY,
  RPC_ENDPOINT,
  ENCRYPTION_KEY,
  TOKEN_DATA_URL,
  CHANNEL_ID,
  NETWORK_NAME,
  LOGS_CHANNEL_ID,
  API_AUTH_KEY,
  PORT,
  PAYMENT_LOGS_CHANNEL_ID,
  MAIN_ADDRESS,
  BUY_BOT_API,
  TRENDING_PRICES,
  AD_PRICES,
  COINGECKO_API_KEY,
  BANNED_TOKENS,
  TRENDING_BUY_BOT_API,
} = process.env;

export const BOT_URL = `https://t.me/${BOT_USERNAME}`;
export const PINNED_MSG_ID = Number(process.env.PINNED_MSG_ID);
