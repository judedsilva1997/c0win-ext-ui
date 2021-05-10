const BASE_URL = "https://cdn-api.co-vin.in/api";

// const BASE_URL = "http://localhost:3000";

export default {
  STATE_URL: `${BASE_URL}/v2/admin/location/states`,
  DISTRICT_URL: `${BASE_URL}/v2/admin/location/districts`,
  BENE_URL: `${BASE_URL}/v2/appointment/beneficiaries`,
  BY_PIN: `${BASE_URL}/v2/appointment/sessions/calendarByPin`,
  BY_DISTRICT: `${BASE_URL}/v2/appointment/sessions/calendarByDistrict`,
  SCHEDULE: `${BASE_URL}/v2/appointment/schedule`,
  CAPTCHA: `${BASE_URL}/v2/auth/getRecaptcha`,
  GENERATE_OTP: `${BASE_URL}/v2/auth/generateMobileOTP`,
  LOGIN: `${BASE_URL}/v2/auth/validateMobileOtp`,
};
