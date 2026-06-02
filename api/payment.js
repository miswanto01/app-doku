const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const fetch = require("node-fetch");

const CLIENT_ID = process.env.DOKU_CLIENT_ID;
const SECRET_KEY = process.env.DOKU_SECRET_KEY;

function getCurrentTimestamp() {
  return new Date().toISOString().slice(0, 19) + "Z";
}
function generateDigest(body) {
  const hash = crypto.createHash("sha256").update(body, "utf-8").digest();
  return Buffer.from(hash).toString("base64");
}
function generateSignature(clientId, requestId, target, digest, secret, timestamp) {
  let c = `Client-Id:${clientId}\n`;
  c += `Request-Id:${requestId}\n`;
  c += `Request-Timestamp:${timestamp}\n`;
  c += `Request-Target:${target}`;
  if (digest) c += `\nDigest:${digest}`;
  const hmac = crypto.createHmac("sha256", secret).update(c).digest();
  return "HMACSHA256=" + Buffer.from(hmac).toString("base64");
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { amount, customerName, customerPhone, customerId } = req.body;
    const request_id = uuidv4();
    const timestamp = getCurrentTimestamp();
    const url = "/checkout/v1/payment";

    const body = JSON.stringify({
      order: {
        amount,
        invoice_number: request_id,
        currency: "IDR",
        callback_url: "https://creatonomy.blogspot.com",
        callback_url_cancel: "https://creatonomy.blogspot.com",
      },
      payment: {
        payment_due_date: 60,
        payment_method_types: ["QRIS"],
      },
      customer: {
        id: customerId || "GUEST-01",
        name: customerName,
        phone: customerPhone,
        country: "ID",
      },
    });

    const digest = generateDigest(body);
    const signature = generateSignature(CLIENT_ID, request_id, url, digest, SECRET_KEY, timestamp);

    const response = await fetch("https://api.doku.com" + url, {
      method: "POST",
      headers: {
        "Client-Id": CLIENT_ID,
        "Request-Id": request_id,
        "Request-Timestamp": timestamp,
        "Signature": signature,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, message: JSON.stringify(data) });
    }

    res.json({
      success: true,
      payment_url: data.response.payment.url,
      invoice_number: request_id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};