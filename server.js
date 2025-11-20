const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
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

// ---------- SHUTDOWN NOTICE ----------
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>GameMarket - Service Discontinued</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .notice {
            text-align: center;
            padding: 40px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            max-width: 600px;
          }
          h1 { font-size: 2.5rem; margin-bottom: 20px; }
          p { font-size: 1.2rem; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="notice">
          <h1>Service Discontinued</h1>
          <p>GameMarket is no longer in operation. Thank you for your past support.</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(4242, ()=>console.log("Backend running at http://localhost:4242/"));
