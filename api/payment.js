export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    return res.status(200).json({
      success: true,
      received: req.body
    });
  }

  return res.status(200).json({
    success: true,
    message: "API hidup"
  });
}

// const crypto = require("crypto");
// const { v4: uuidv4 } = require("uuid");

// const CLIENT_ID  = process.env.DOKU_CLIENT_ID;
// const SECRET_KEY = process.env.DOKU_SECRET_KEY;

// function getCurrentTimestamp() {
//   return new Date().toISOString().slice(0, 19) + "Z";
// }
// function generateDigest(body) {
//   const hash = crypto.createHash("sha256").update(body, "utf-8").digest();
//   return Buffer.from(hash).toString("base64");
// }
// function generateSignature(clientId, requestId, target, digest, secret, timestamp) {
//   let c  = `Client-Id:${clientId}\n`;
//       c += `Request-Id:${requestId}\n`;
//       c += `Request-Timestamp:${timestamp}\n`;
//       c += `Request-Target:${target}`;
//   if (digest) c += `\nDigest:${digest}`;
//   const hmac = crypto.createHmac("sha256", secret).update(c).digest();
//   return "HMACSHA256=" + Buffer.from(hmac).toString("base64");
// }

// module.exports = async (req, res) => {
//   // CORS — wajib ada di setiap response termasuk error
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//    if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }

//   return res.status(200).json({
//     status: "OK",
//     time: Date.now()
//   });

//   if (req.method === "OPTIONS") {
//     return res.status(200).end();
//   }

//   if (req.method !== "POST") {
//     return res.status(405).json({ success: false, message: "Method not allowed" });
//   }

//   // Cek env variable
//   if (!CLIENT_ID || !SECRET_KEY) {
//     return res.status(500).json({ success: false, message: "ENV variable belum diset di Vercel" });
//   }

//   try {
//     const { amount, customerName, customerPhone, customerId } = req.body;

//     if (!amount || !customerName || !customerPhone) {
//       return res.status(400).json({ success: false, message: "Data tidak lengkap" });
//     }

//     const request_id = uuidv4();
//     const timestamp  = getCurrentTimestamp();
//     const urlPath    = "/checkout/v1/payment";

//     const bodyStr = JSON.stringify({
//       order: {
//         amount:              Number(amount),
//         invoice_number:      request_id,
//         currency:            "IDR",
//         callback_url:        "https://creatonomy.blogspot.com",
//         callback_url_cancel: "https://creatonomy.blogspot.com",
//       },
//       payment: {
//         payment_due_date:     60,
//         payment_method_types: ["VIRTUAL_ACCOUNT_BNI",
//           "VIRTUAL_ACCOUNT_BANK_PERMATA"],
//       },
//       customer: {
//         id:      customerId || "GUEST-01",
//         name:    customerName,
//         phone:   customerPhone,
//         country: "ID",
//       },
//     });

//     const digest    = generateDigest(bodyStr);
//     const signature = generateSignature(CLIENT_ID, request_id, urlPath, digest, SECRET_KEY, timestamp);

//     // Gunakan https bawaan Node.js — tanpa node-fetch
//     const result = await new Promise((resolve, reject) => {
//       const https = require("https");
//       const options = {
//         hostname: "api.doku.com",
//         path:     urlPath,
//         method:   "POST",
//         headers: {
//           "Client-Id":         CLIENT_ID,
//           "Request-Id":        request_id,
//           "Request-Timestamp": timestamp,
//           "Signature":         signature,
//           "Content-Type":      "application/json",
//           "Content-Length":    Buffer.byteLength(bodyStr),
//         },
//       };

//       const reqDoku = https.request(options, (resDoku) => {
//         let data = "";
//         resDoku.on("data", chunk => data += chunk);
//         resDoku.on("end", () => resolve({ status: resDoku.statusCode, body: data }));
//       });

//       reqDoku.on("error", reject);
//       reqDoku.write(bodyStr);
//       reqDoku.end();
//     });

// const data = JSON.parse(result.body);

//     if (result.status !== 200) {
//       console.log("DOKU ERROR:", result.status, JSON.stringify(data));
//       return res.status(500).json({ success: false, message: JSON.stringify(data) });
//     }

//     return res.status(200).json({
//       success:        true,
//       payment_url:    data.response.payment.url,
//       invoice_number: request_id,
//     });

//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
 
