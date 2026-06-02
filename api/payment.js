const crypto = require("crypto");
const https = require("https");
const { v4: uuidv4 } = require("uuid");

const CLIENT_ID = process.env.DOKU_CLIENT_ID;
const SECRET_KEY = process.env.DOKU_SECRET_KEY;

function getCurrentTimestamp() {
  return new Date().toISOString().slice(0, 19) + "Z";
}

function generateDigest(body) {
  const hash = crypto
    .createHash("sha256")
    .update(body, "utf8")
    .digest();

  return Buffer.from(hash).toString("base64");
}

function generateSignature(
  clientId,
  requestId,
  target,
  digest,
  secret,
  timestamp
) {
  let component = `Client-Id:${clientId}\n`;
  component += `Request-Id:${requestId}\n`;
  component += `Request-Timestamp:${timestamp}\n`;
  component += `Request-Target:${target}\n`;
  component += `Digest:${digest}`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(component)
    .digest();

  return "HMACSHA256=" + Buffer.from(hmac).toString("base64");
}

module.exports = async (req, res) => {
  // ======================
  // CORS
  // ======================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("POST MASUK");
console.log("BODY:", req.body);
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }


  
  try {

    console.log("TRY DIMULAI");// ======================
    // ENV CHECK
    // ======================
    if (!CLIENT_ID || !SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "ENV variable belum diset di Vercel",
      });
    }

    const {
      amount,
      customerName,
      customerPhone,
      customerId,
    } = req.body || {};

    if (!amount || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Data tidak lengkap",
      });
    }

    const request_id = uuidv4();
    const timestamp = getCurrentTimestamp();
    const urlPath = "/checkout/v1/payment";

    const bodyObject = {
      order: {
        amount: Number(amount),
        invoice_number: request_id,
        currency: "IDR",
        callback_url: "https://creatonomy.blogspot.com",
        callback_url_cancel: "https://creatonomy.blogspot.com",
      },
      payment: {
        payment_due_date: 60,
        payment_method_types: [
          "VIRTUAL_ACCOUNT_BNI",
          "VIRTUAL_ACCOUNT_BANK_PERMATA",
        ],
      },
      customer: {
        id: customerId || "GUEST-01",
        name: customerName,
        phone: customerPhone,
        country: "ID",
      },
    };

    const bodyStr = JSON.stringify(bodyObject);

    const digest = generateDigest(bodyStr);

    const signature = generateSignature(
      CLIENT_ID,
      request_id,
      urlPath,
      digest,
      SECRET_KEY,
      timestamp
    );

    console.log("SEBELUM REQUEST DOKU");
    // ======================
    // REQUEST KE DOKU
    // ======================
    const result = await new Promise((resolve, reject) => {
      const reqDoku = https.request(
        {
          hostname: "api.doku.com",
          path: urlPath,
          method: "POST",
          headers: {
            "Client-Id": CLIENT_ID,
            "Request-Id": request_id,
            "Request-Timestamp": timestamp,
            "Signature": signature,
            "Digest": digest,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr),
          },
        },
        (resDoku) => {
          let raw = "";

          resDoku.on("data", (chunk) => {
            raw += chunk;
          });

          resDoku.on("end", () => {
            resolve({
              status: resDoku.statusCode,
              body: raw,
            });
          });
        }
      );

      reqDoku.on("error", reject);

      reqDoku.write(bodyStr);
      reqDoku.end();
    });

    console.log("DOKU STATUS:", result.status);
    console.log("DOKU RAW:", result.body);

    let data;

    try {
      data = JSON.parse(result.body);
    } catch (err) {
      return res.status(500).json({
        success: false,
        parse_error: true,
        raw_response: result.body,
      });
    }

    if (result.status !== 200) {
      return res.status(500).json({
        success: false,
        doku_status: result.status,
        doku_response: data,
      });
    }

    console.log(
      "DOKU RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    return res.status(200).json({
      success: true,
      invoice_number: request_id,
      doku_response: data,
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
