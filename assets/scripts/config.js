export const baseUrl = "https://api-nodejs-liturgia-diaria.vercel.app";
// export const baseUrl = "http://localhost:3000";
  
export const endpoints = {
  todayMissallete: `${baseUrl}/missallete/today`,
  sundayMissallete: `${baseUrl}/missallete/sunday`
};