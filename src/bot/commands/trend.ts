import { apiFetcher } from "@/utils/api";
import { trendPrices } from "@/utils/constants";
import { isValidSolAddress } from "@/utils/web3";
import { trendingState, userState } from "@/vars/state";
import { toTrendTokens } from "@/vars/trending";
import {
  CallbackQueryContext,
  CommandContext,
  Context,
  InlineKeyboard,
} from "grammy";
import { preparePayment } from "../payment";
import { isValidUrl } from "@/utils/general";
import { TerminalData } from "@/types/terminal";
import { PairsData } from "@/types";
import { TOKEN_DATA_URL } from "@/utils/env";
import { errorHandler } from "@/utils/handlers";

export async function trend(ctx: CommandContext<Context>) {
  const { id: chatId } = ctx.chat;
  userState[chatId] = "toTrend";
  const text = `To trend a token, please provide the token's address in the next message`;
  ctx.reply(text).catch((e) => errorHandler(e));
}

export async function addTrendingSocial(ctx: CommandContext<Context>) {
  const { id: chatId } = ctx.chat;
  const token = ctx.message?.text;

  if (!isValidSolAddress(token || "")) {
    return ctx.reply("Please enter a proper token address");
  }

  const terminalResponse = apiFetcher<TerminalData>(
    `https://api.geckoterminal.com/api/v2/search/pools?query=${token}&network=ton&page=1`
  );
  const dexSResonse = apiFetcher<PairsData>(`${TOKEN_DATA_URL}/${token}`);

  const [terminalData, dexSData] = await Promise.all([
    terminalResponse,
    dexSResonse,
  ]);

  if (
    terminalData?.data.data?.length === 0 &&
    dexSData?.data.pairs?.length === 0
  ) {
    return ctx.reply("The address you entered has no pairs on Ton");
  }

  const storedTokenData = toTrendTokens.find(
    ({ token: storedToken }) => storedToken === token
  );
  if (storedTokenData) {
    const { slot } = storedTokenData;
    return ctx.reply(`Token ${token} is already trending at rank ${slot}`);
  }

  trendingState[chatId] = { token };

  userState[chatId] = "trendSocials";
  const text = `Please pass a social link related to the token in the next message`;
  ctx.reply(text).catch((e) => errorHandler(e));
}

export async function setTrendingEmoji(ctx: CommandContext<Context>) {
  const { id: chatId } = ctx.chat;
  const link = ctx.message?.text || "";

  if (!isValidUrl(link)) {
    return ctx.reply("Please enter a valid URL");
  }

  trendingState[chatId] = { ...trendingState[chatId], social: link };
  delete userState[chatId];

  ctx.reply(
    "Send an emoji in the next message, this emoji will be shown in the buybot messages in the trending channel."
  );
  userState[chatId] = "trendEmoji";
}

// export async function setTrendingGif(ctx: CommandContext<Context>) {
//   const { id: chatId } = ctx.chat;
//   const emoji = ctx.message?.text || "";

//   trendingState[chatId] = { ...trendingState[chatId], emoji };
//   delete userState[chatId];

//   ctx.reply(
//     "Send a GIF in the next message, this GIF will be shown in the buybot messages in the trending channel."
//   );
//   userState[chatId] = "trendGif";
// }

export async function selectTrendingDuration(ctx: CommandContext<Context>) {
  // const { id: chatId } = ctx.chat;

  // const { message, channel_post } = ctx.update;
  // const { animation, video } = message || channel_post;
  // const videoSource = animation || video;

  // if (!videoSource) return ctx.reply("Please send a valid GIF or video");

  // const { file_id: gif, mime_type } = videoSource;
  // const isValidMimeType =
  //   mime_type?.includes("video") || mime_type?.includes("gif");

  // if (!isValidMimeType) return ctx.reply("Please send a valid GIF or video");

  // trendingState[chatId] = { ...trendingState[chatId], gif };
  // delete userState[chatId];
  const { id: chatId } = ctx.chat;
  const emoji = ctx.message?.text || "";

  trendingState[chatId] = { ...trendingState[chatId], emoji };
  delete userState[chatId];

  const text = "Select the duration you want your token to trend for.";
  let keyboard = new InlineKeyboard();

  const tiersFilled = { 1: 0, 2: 0, 3: 0 };
  for (const token of toTrendTokens) {
    tiersFilled[token.slot] += 1;
  }

  if (tiersFilled[1] !== 3) {
    keyboard = keyboard.text("⬇️ Top 3 ⬇️");
    for (const [duration, price] of Object.entries(trendPrices[1])) {
      const slotText = `${duration} hours - ${price} SOL`;
      keyboard = keyboard.text(slotText, `trendDuration-1-${duration}`);
    }
  }

  if (tiersFilled[2] !== 7) {
    keyboard = keyboard.row().text("⬇️ 3 - 10 ⬇️");
    for (const [duration, price] of Object.entries(trendPrices[2])) {
      const slotText = `${duration} hours - ${price} SOL`;
      keyboard = keyboard.text(slotText, `trendDuration-2-${duration}`);
    }
  }

  keyboard = keyboard.toTransposed();
  //   keyboard = keyboard.row().text("⬇️ 11 - 20 ⬇️").row();

  //   if (tiersFilled[3] !== 10) {
  //     for (const [duration, price] of Object.entries(trendPrices[3])) {
  //       const slotText = `${duration} hours - ${price} SOL`;
  //       keyboard = keyboard.text(slotText, `trendDuration-3-${duration}`).row();
  //     }
  //   }

  ctx.reply(text, { reply_markup: keyboard });
}

export function prepareTrendingState(ctx: CallbackQueryContext<Context>) {
  // @ts-expect-error temp
  const chatId = ctx.chat?.id || "";
  const [slot, duration] = ctx.callbackQuery.data
    .replace("trendDuration-", "")
    .split("-")
    .map((item) => Number(item));

  trendingState[chatId] = { ...trendingState[chatId], slot, duration };
  preparePayment(ctx);
}
