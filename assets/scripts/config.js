export const baseUrl = "https://api-nodejs-liturgia-diaria.vercel.app";
// export const baseUrl = "http://localhost:3000";

export const endpoints = {
  todayMissallete: `${baseUrl}/missallete/today`,
  sundayMissallete: `${baseUrl}/missallete/sunday`,
  tomorrowLiturgy: `${baseUrl}/missallete/tomorrow-liturgy`,
  pushSubscribe: `${baseUrl}/push/subscribe`,
  pushUnsubscribe: `${baseUrl}/push/unsubscribe`,
  pushMarkSeen: `${baseUrl}/push/mark-seen`,
};

// VAPID public key — must match the VAPID_PUBLIC_KEY env var set in the API server.
// Generate a key pair with: npx web-push generate-vapid-keys
export const VAPID_PUBLIC_KEY = "BF7YRsp9zggVOdHsyGZB0oz8j_DD0w_gKAc8rHtPtg-T08-Z9XCOERYYIBSS80OA50vlCrsChORCEbsxdHxTSzY";
