const fs = require('fs');
const config = {
  "type": "service_account",
  "project_id": "clientos-dc899",
  "private_key_id": "876b8b4a73ed55dfa186d7b05d582ee5a0aa692a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9whOwIU6+zO6E\n7A/At/KmQp2M7aNS2rQOtF3SqmybrBMOtxugie3EgcNGpUaFdcsTgicp/NQ7lOUB\nqjEsfxUvuge/Xf9mN5Dyu9AvxsyM9OaAkn34NDiyQrSUTLA5bIdyqsm21ao295SC\n/D7S0NTLW/71Xu86pSuH5N6PRKhhgiRymIxQg4aJTOoddAXbkMFQPg5zv0JzpjkP\n+SQ/XPk38Y6EmHz79quYG9x/dO15E5SVw9GYrklev7x0pw8n3QLFW752ivcYU01x\nXlIOxPlipwcb+wAQQb7VJk6IzpCaL6/m+LX8mOI6gdixjBq22NADSVoILh+B1/WY\nzL81lx3lAgMBAAECggEABdgs6A9WkAzaydBFee+Qcyt5E8ab8ajXw94tR5hFKRRH\nL/xWxv6IirVecNYVUnX6z7qB/0qQtNcUqJT318GAQwyNQYkhHSJX/gnn0xjh4vOG\nB+67H4JoPqFMU4b7JIGhuFfnR5DUIcZFVjVzr+WLsEnAlAkdACbnLNPRQQNh1kLw\nwKepFlM7vXyyUFmmVofb9D5f3cbZZ+STkHJJVvnoIuNpPA8U5NPVuEHX+WE6hPyi\n2HQW+m5Bqs1pNk7JOfkWQKXli/a+Dj6G+aBIeRioJVZXNojiRore5105NVN/9a9t\n7dUfqsEeyE0e0jcLlVpfT/L5oH9vvAIP8omzpoVCbwKBgQDwZiYlPOxSU44ygcFG\n7XpJfwuocRvkuEQnc08JBU1tNxsFoRcwkJufRdTbPMZNYhYQZ/FDhq1AjPYKau4w\nZEOJK+Fb6RDdlhuIZIlzzns18qjWKwhhlgptBbEGl4vu0IxddlsZ3Meosep1iu5x\n42uMLtOIwt/mYoFALdO1vbH2RwKBgQDKEpvoYNnX2h7gkT1X/LYU4RJslgwJ3mO5\nFXxpko36n01bG6Y2C8M6+2SW84Q27EsXmpWvzb3Nxixdaq53Tc0QntlqwCvIFmeO\nPdE9tCDEhCj9JfL1zpnOtH3E7IqR6Ssjm4o0leuJYYp/tS+pqcUSU6GQJgjh/9kX\noe7uLCCkcwKBgQDKMRAqR8h4IcC6qDm4fypYQJu8i42rXHQuPiSecLBDiJKYtHm9\phLN7jzuPHqJQVNPby0T32U+opCaCH/Xgazv5VFBLZC63nK/z9dv6J3mrPbmUwFU\mo6gTaYr5jCSpyM3xMEwymm/cAzD2htc/KtLF2NhZo5MxlLxeNnUxPy2JwKBgA2c\nH0ARddqh6D57ycPpU2IonpMNsBXiEplepxh9NG7S1+TxAcrWE/ofAHFiSV9hntUi\nJj7G/qejV02bZ9DFPrCF4mLcOpapW6Qq6bLcNPDHbfNO4QRJO/a+FVJ0FAkrySoG\nydIs3sZL+YYMb/9fXdSUKWeKCEMgdkCvOWZ1NmWdAoGBAK8UvldAdZv8s3+IF8r/\nW+1Tmbkigg9zSMcJjcya3U2ucwZ2SR/piPRTpu8NYNVVwMwYe1lRIuJTVIyQ8mYT\nDWv9blxZ1fJwr8Qijcrmh6GsldhRXTaN/47qRebAiJ6RHhVLdFyqF2g5e7xdzdbZ\n4BrXlg33y5rf2klWOONVQWt2\n-----END PRIVATE KEY-----",
  "client_email": "firebase-adminsdk-fbsvc@clientos-dc899.iam.gserviceaccount.com",
  "client_id": "114172743582998536733",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40clientos-dc899.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
fs.writeFileSync('supabase/functions/common/service-account.json', JSON.stringify(config, null, 2));
