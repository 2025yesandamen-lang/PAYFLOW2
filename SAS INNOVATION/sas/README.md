# PayFlow - WhatsApp Invoice & Payment Reminder System

A simple and elegant SaaS web application for creating invoices and sending WhatsApp payment reminders to customers.

## 🌟 Features

- **User Authentication**: Secure email/password signup and login
- **Invoice Management**: Create, view, and manage invoices
- **WhatsApp Integration**: Send pre-filled invoice reminders via WhatsApp
- **Status Tracking**: Mark invoices as Pending or Paid
- **Real-time Sync**: Live updates across multiple devices
- **Mobile Responsive**: Works seamlessly on desktop and mobile
- **Secure**: Firebase authentication and Firestore security rules

## 🛠️ Tech Stack

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Firebase (Authentication + Firestore)
- **Hosting**: Firebase Hosting
- **SDK**: Firebase v9 Modular SDK

## 📁 Folder Structure

```
PayFlow/
├── public/
│   ├── index.html              # Landing page
│   ├── auth/
│   │   └── login.html          # Login/Signup page
│   ├── dashboard/
│   │   └── index.html          # Dashboard & invoice management
│   ├── css/
│   │   └── styles.css          # Tailwind + custom styles
│   ├── js/
│   │   ├── firebase-config.js  # Firebase configuration
│   │   ├── auth.js             # Authentication logic
│   │   ├── invoice.js          # Invoice management
│   │   └── whatsapp.js         # WhatsApp integration
│   └── assets/
│       └── logo.png            # Logo (optional)
├── firebase.json               # Firebase hosting config
├── firestore.rules             # Firestore security rules
├── .firebaserc                 # Firebase project config
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase account (https://firebase.google.com)
- WhatsApp account for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/payflow.git
   cd payflow
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Create Firebase Project**
   - Go to https://firebase.google.com
   - Click "Go to console"
   - Create a new project
   - Note your Project ID

4. **Configure Firebase**
   - In Firebase Console, go to Project Settings
   - Copy your config credentials
   - Update `public/js/firebase-config.js`:
     ```javascript
     const firebaseConfig = {
         apiKey: "YOUR_API_KEY",
         authDomain: "YOUR_AUTH_DOMAIN",
         projectId: "YOUR_PROJECT_ID",
         storageBucket: "YOUR_STORAGE_BUCKET",
         messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
         appId: "YOUR_APP_ID"
     };
     ```

5. **Update .firebaserc**
   ```json
   {
     "projects": {
       "default": "YOUR_PROJECT_ID"
     }
   }
   ```

6. **Deploy to Firebase**
   ```bash
   firebase login
   firebase deploy
   ```

### Local Development

1. **Start Firebase Emulator (optional)**
   ```bash
   firebase emulators:start
   ```

2. **Use Firebase Hosting**
   ```bash
   firebase serve
   ```
   Access at `http://localhost:5000`

3. **Or use any local server**
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```

## 📖 Usage

### Sign Up / Login
1. Visit the landing page
2. Click "Sign Up" or "Login"
3. Enter your email and password
4. Click the respective button

### Create Invoice
1. From dashboard, click "+ Create Invoice"
2. Fill in customer details:
   - Customer Name
   - Phone Number (with country code, e.g., +1)
   - Amount
   - Due Date
   - Description (optional)
3. Click "Create Invoice"

### Send WhatsApp Reminder
1. From invoice card, click "📱 Send WhatsApp"
2. Pre-filled message with invoice details opens
3. Confirm and send in WhatsApp

### Mark as Paid
1. Click "✓ Mark as Paid" button
2. Invoice status changes to "Paid"

### Delete Invoice
1. Click "🗑️ Delete" button
2. Confirm deletion

## 🔐 Security

### Firebase Authentication
- Email/password authentication with Firebase
- Passwords hashed and stored securely
- Session management handled by Firebase

### Firestore Security Rules
```firestore
- Users can only read/write their own invoices
- Create requires authenticated user
- Denies all other access
```

### Data Privacy
- No sensitive data stored in localStorage
- All data encrypted in transit (HTTPS)
- Firebase provides backup and recovery

## 📱 WhatsApp Integration

### How It Works
1. Click "Send WhatsApp" on any invoice
2. WhatsApp link opens with pre-filled message
3. Message includes:
   - Customer name
   - Invoice amount
   - Due date
   - Description (if provided)
4. User confirms and sends message

### Supported Phone Formats
- +1 234 567 8900
- +1-234-567-8900
- +1(234)567-8900
- +12345678900

### Links Used
- **Desktop**: `https://web.whatsapp.com/send`
- **Mobile**: `https://wa.me/`

## 🎨 Customization

### Change Colors
Update CSS variables in `public/css/styles.css`:
```css
:root {
    --primary-color: #4f46e5;     /* Indigo */
    --success-color: #10b981;     /* Green */
    --danger-color: #ef4444;      /* Red */
}
```

### Change Invoice Message
Edit `generateInvoiceMessage()` in `public/js/whatsapp.js`:
```javascript
const message = `Your custom message here`;
```

### Add New Features
- Modify `invoice.js` for new CRUD operations
- Extend Firestore with new collections
- Update UI in HTML files

## 📊 Firestore Database Structure

```
invoices/
├── invoiceId1
│   ├── userId: "user123"
│   ├── customerName: "John Doe"
│   ├── customerPhone: "+1234567890"
│   ├── amount: 150.00
│   ├── dueDate: Date
│   ├── description: "Project payment"
│   ├── status: "Pending" | "Paid"
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

## 🐛 Troubleshooting

### Login Loop
- Clear browser cache and cookies
- Check Firebase config is correct
- Verify Firestore security rules allow read/write

### Invoices Not Loading
- Check browser console for errors
- Verify user is authenticated
- Check Firestore security rules
- Ensure Firestore database is created

### WhatsApp Link Not Working
- Check phone number format (include country code)
- Ensure WhatsApp is installed on device
- Try both `web.whatsapp.com` and `wa.me/` links

### Deploy Issues
- Run `firebase deploy --only hosting`
- Check Firebase CLI is logged in: `firebase login`
- Verify `.firebaserc` has correct project ID

## 📈 Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Invoice templates
- [ ] Recurring invoices
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Invoice analytics and reports
- [ ] Team collaboration
- [ ] PDF invoice generation
- [ ] SMS reminders
- [ ] Mobile app (React Native)

## 📄 License

MIT License - feel free to use this project for commercial or personal purposes.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@payflow.com

## 🙏 Acknowledgments

- Firebase for backend services
- Tailwind CSS for styling
- WhatsApp for messaging integration

---

**Happy invoicing! 🎉**