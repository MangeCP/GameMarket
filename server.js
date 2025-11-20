const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const stripe = require('stripe')('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');
const cors = require('cors');

const ADMIN_PASSWORD = "letmein123"; // <- CHANGE THIS!
const ACCOUNTS_FILE = 'accounts.json';
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ADMIN PANEL (simple, expand as needed!)
app.get("/admin", (req, res) => {
  const { code } = req.query;
  if (code !== ADMIN_PASSWORD) return res.status(401).send("Unauthorized");
  let creds = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf-8"));
  res.send(`<h2>Accounts in stock</h2>
    <form action="/admin/add?code=${ADMIN_PASSWORD}" method="POST">
      <input name="creds" placeholder="email:password,comma,separated">
      <button>Add</button>
    </form>
    <ul>${creds.map((c,i)=>`<li>${c} <a href="/admin/remove?code=${ADMIN_PASSWORD}&idx=${i}">Remove</a></li>`).join("")}</ul>
  `);
});
app.post("/admin/add", express.urlencoded({extended:true}), (req, res) => {
  const code = req.query.code;
  if(code !== ADMIN_PASSWORD) return res.status(401).send("Unauthorized");
  let credsIn = req.body.creds.split(',').map(s=>s.trim()).filter(Boolean);
  let creds = JSON.parse(fs.readFileSync(ACCOUNTS_FILE,"utf-8"));
  creds.push(...credsIn);
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(creds,null,2));
  res.redirect(`/admin?code=${ADMIN_PASSWORD}`);
});
app.get("/admin/remove", (req,res)=>{
  const code = req.query.code;
  if(code !== ADMIN_PASSWORD) return res.status(401).send("Unauthorized");
  let idx = parseInt(req.query.idx);
  let creds = JSON.parse(fs.readFileSync(ACCOUNTS_FILE,"utf-8"));
  creds.splice(idx,1); fs.writeFileSync(ACCOUNTS_FILE,JSON.stringify(creds,null,2));
  res.redirect(`/admin?code=${ADMIN_PASSWORD}`);
});

// -------- CREDENTIAL DELIVERY LOGIC
function getCredentials(n) {
  let creds = JSON.parse(fs.readFileSync(ACCOUNTS_FILE,"utf-8"));
  if (creds.length < n) return {error: "Out of stock.", details:[]};
  let out = creds.splice(0, n);
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(creds,null,2));
  return {error: null, details: out}
}

// ---------- STRIPE PAYMENTS ----------
app.post("/create-payment-intent", async (req, res) => {
  let { cart, email } = req.body;
  let amount = 0;
  cart.forEach(item => {
    if(item.id === "steam") amount += 1299 * item.qty;
    if(item.id === "fivem") amount += 899 * item.qty;
    if(item.id === "discord") amount += 699 * item.qty;
    if(item.id === "ipvanish") amount += 949 * item.qty;
  });
  // Stripe expects amount in cents
  const paymentIntent = await stripe.paymentIntents.create({
    amount, currency: 'usd', receipt_email: email, metadata: {cart: JSON.stringify(cart)}
  });
  res.json({clientSecret: paymentIntent.client_secret});
});

app.post("/get-credentials", async (req, res)=>{
  let {paymentIntentId, cart, email} = req.body;
  let pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== "succeeded") return res.json({success:false, error:"Payment not completed."});
  let n_total = cart.reduce((t,i)=>t+i.qty,0);
  let {error, details} = getCredentials(n_total);
  if(error) return res.json({success:false, error});
  res.json({success:true, details});
});

app.listen(4242, ()=>console.log("Backend running at http://localhost:4242/"));
