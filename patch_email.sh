# 1. Add endpoint to server/index.js
awk '/app.post\('\''\/api\/settings/ { print; print "app.post('\''/api/settings/test-email'\'', async (req, res) => {\n  try {\n    const settings = req.body;\n    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {\n      return res.status(400).json({ success: false, error: '\''Missing SMTP settings'\'' });\n    }\n    const nodemailer = require('\''nodemailer'\'');\n    const transporter = nodemailer.createTransport({\n      host: settings.smtpHost,\n      port: parseInt(settings.smtpPort) || 587,\n      secure: parseInt(settings.smtpPort) === 465,\n      auth: {\n        user: settings.smtpUser,\n        pass: settings.smtpPass\n      }\n    });\n    const from = settings.smtpFrom || settings.smtpUser;\n    await transporter.sendMail({\n      from: `\"Bastion Test\" <${from}>`,\n      to: settings.globalAdminEmail || settings.smtpUser,\n      subject: \"Bastion: Test Email\",\n      text: \"If you are reading this, your SMTP configuration is working perfectly!\"\n    });\n    res.json({ success: true });\n  } catch (err) {\n    res.status(500).json({ success: false, error: err.message });\n  }\n});"; next }1' server/index.js > server/index.js.tmp && mv server/index.js.tmp server/index.js

# 2. Add button to Settings.jsx
sed -i '' '/<h2>Email Notifications (SMTP)<\/h2>/a\
        <button type="button" className="btn btn-secondary btn-sm" style={{ float: "right", marginTop: "-35px" }} onClick={async () => {\
          try {\
            const res = await axios.post(API_BASE + "/api/settings/test-email", settings);\
            if (res.data.success) alert("Test email sent successfully!");\
            else alert("Error: " + res.data.error);\
          } catch (err) {\
            alert("Error sending test email: " + (err.response?.data?.error || err.message));\
          }\
        }}>Test Connection</button>\
' client/src/components/Settings.jsx
