# Unifi Auto-Password Manager

A local application that connects to a Unifi Controller to automatically change the Wi-Fi password for specific networks (like guest networks or board rooms) on a scheduled basis. It features a modern React frontend that displays the current password and a QR code for easy connection.

## Features

- **Automated Password Rotation**: Automatically generates and sets a new, secure passphrase for configured Unifi Wi-Fi networks on a schedule (e.g., daily at midnight).
- **QR Code Display**: Shows the current Wi-Fi password and a scannable QR code so guests can connect instantly without typing.
- **Multiple Networks**: Supports rotating passwords for multiple Wi-Fi networks/board rooms simultaneously.
- **Unifi OS Support**: Fully compatible with modern Unifi OS consoles (UDM, UDM Pro, UDR, UCG, etc.) as well as older classic controllers.

---

## ⚠️ Unifi Controller Setup (CRITICAL)

To allow this application to update your Wi-Fi passwords, you **MUST** create a local administrator account on your Unifi Controller. The API will likely reject login attempts using your Ubiquiti Cloud/SSO email (e.g., due to 2FA or cloud restrictions).

**How to create a Local Admin:**
1. Log into your Unifi Console in your web browser.
2. Go to **OS Settings** -> **Admins & Users**.
3. Click **Add New Admin** (or the `+` icon).
4. Make sure "Allow Ubiquiti SSO" or "Require UI Account" is **UNCHECKED**. You want this to be **Local Access Only**.
5. Give the user a simple username (e.g., `apiuser`) and a strong password. *(Note: If newer Unifi OS versions force you to enter an email, just use a fake one like `api@myhome.local`—it will act as your username).*
6. Assign the user **Network Admin** or **Full Management** privileges. (View-only is not enough; the app needs permission to edit Wi-Fi settings).
7. Save the user. 

---

## Installation & Running

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- Your Unifi equipment must be on and accessible from the machine running this app.

### Starting the Application

To set up and run the application for the first time, simply copy and paste these commands into your terminal:

```bash
# Clone the repository
git clone https://github.com/Tymexx/unifi-pass-manager.git

# Enter the directory
cd unifi-pass-manager

# Install the backend dependencies
cd server
npm install

# Install the frontend dependencies
cd ../client
npm install

# Go back to the root directory
cd ..

# Run the startup script to launch both servers
sh start.sh
```

1. The script will boot up the backend API and the Vite frontend. 
2. Open your web browser and go to: **http://localhost:5180**

*(To stop the application, just press `Ctrl+C` in the terminal where the script is running).*

---

## App Configuration

Once the app is running and you've opened the web interface, go to the **Settings** tab (the gear icon) at the bottom to configure your system.

### Global Settings
- **Unifi Controller Host**: The IP address of your Unifi console (e.g., `192.168.1.1`).
- **Username**: The local admin username you created earlier (e.g., `apiuser`).
- **Password**: The local admin password.
- **Site ID**: For almost all home setups (UDM, UCG, etc.), this should be exactly **`default`**.

### Board Rooms (Networks)
Click **+ Add Room** to configure a specific Wi-Fi network.
- **Room Name**: The friendly name displayed in the dropdown (e.g., "Main Board Room").
- **WLAN ID**: The internal Unifi ID for your Wi-Fi network. 
  *(To find this, open your Unifi Network app in a browser, click on the Wi-Fi network you want to manage, and look at the URL. It will look something like `.../settings/wifi/6a8d895280a8a70e617c43dc` — copy that long string).*
- **SSID Name**: The exact, case-sensitive broadcast name of the Wi-Fi network. **This must be perfectly accurate**, otherwise the generated QR code will fail to connect guests.
- **Custom Schedule**: Each network gets its own schedule (e.g., `0 0 * * *` for midnight). Set this individually depending on how often that room's Wi-Fi needs rotating.

Click **Save All Settings** when done. You can then click **Force Rotate All Now** to test the connection immediately. If you get a green success message, you're all set!

---

## Kiosk Display (For Tablets & Phones)

Once a network is configured, you can launch a dedicated, full-screen **Kiosk Display** for it. This is designed to run on a tablet (like an iPad) mounted in a board room or on a phone behind a front desk.

**How to use:**
1. From the main Dashboard, find the network you want to display.
2. Click the **Open Kiosk** button in the bottom right corner of the network card.
3. A new tab will open displaying a beautiful, edge-to-edge UI showing the network name, a scannable QR code, and a hidden passphrase modal.
4. The Kiosk display automatically polls the server every 5 seconds. When a password rotation schedule hits, the Kiosk screen will update instantly without you having to touch it!

*Tip: You can use "Add to Home Screen" on an iPad to run this page as a full-screen, native-feeling app without browser toolbars.*
