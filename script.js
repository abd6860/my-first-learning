// ⚠️ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBZtof8PCCAGqGGuPkH_aNSsIayEDLru3U",
    authDomain: "hb-ride-a9b5d.firebaseapp.com",
    projectId: "hb-ride-a9b5d",
    storageBucket: "hb-ride-a9b5d.firebasestorage.app",
    messagingSenderId: "541954546180",
    appId: "1:541954546180:web:b176f507a4271add44b351"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ⚠️ Admin Email
const ADMIN_EMAIL = "dustotuhin2021@gmail.com";

// Global Variables
let currentUserData = null;
let selectedCar = null;
let estimatedFare = 0;

// DOM Elements
const loginBox = document.getElementById('loginBox');
const signupBox = document.getElementById('signupBox');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleSignupBtn = document.getElementById('googleSignupBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const backToLoginBtn2 = document.getElementById('backToLoginBtn2');
const forgotBtn = document.getElementById('forgotBtn');
const toggleLoginPass = document.getElementById('toggleLoginPass');
const toggleSignupPass1 = document.getElementById('toggleSignupPass1');
const toggleSignupPass2 = document.getElementById('toggleSignupPass2');
const exportUsersBtn = document.getElementById('exportUsersBtn');

// Page Load - FIX: Proper Auth Check
window.addEventListener('load', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserData(user.email);
            showDashboard();
        } else {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                await loadUserData(savedUser);
                if (currentUserData) {
                    showDashboard();
                } else {
                    showLogin();
                }
            } else {
                showLogin();
            }
        }
    });
});

// Load User Data from Firestore
async function loadUserData(email) {
    try {
        const doc = await db.collection('users').doc(email).get();
        if (doc.exists) {
            currentUserData = { email,...doc.data() };
            localStorage.setItem('currentUser', email);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading user:', error);
        return false;
    }
}

// UI Functions
function showSignup() {
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
    dashboard.classList.add('hidden');
    document.body.classList.add('login-page');
    clearMessages();
}

function showLogin() {
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    dashboard.classList.add('hidden');
    document.body.classList.add('login-page');
    clearMessages();
}

async function showDashboard() {
    if (!currentUserData) {
        showLogin();
        return;
    }

    loginBox.classList.add('hidden');
    signupBox.classList.add('hidden');
    dashboard.classList.remove('hidden');
    document.body.classList.remove('login-page');
    document.body.classList.add('dashboard-active');

    // User Avatar
    const userAvatar = document.getElementById('userAvatar');
    if (currentUserData.photo) {
        userAvatar.src = currentUserData.photo;
    } else {
        userAvatar.src = `https://ui-avatars.com/api/?name=${currentUserData.name}&background=22c55e&color=fff`;
    }

    // Role Based Dashboard + Hide Bottom Nav for Admin
    const passengerDash = document.getElementById('passengerDashboard');
    const driverDash = document.getElementById('driverDashboard');
    const adminPanel = document.getElementById('adminPanel');
    const bottomNav = document.querySelector('.bottom-nav');

    if (currentUserData.email === ADMIN_EMAIL) {
        adminPanel.classList.remove('hidden');
        passengerDash.classList.add('hidden');
        driverDash.classList.add('hidden');
        bottomNav.classList.add('hidden'); // Admin এর জন্য Bottom Nav Hide
        await loadAdminData();
    } else {
        bottomNav.classList.remove('hidden');
        if (currentUserData.role === 'driver') {
            driverDash.classList.remove('hidden');
            passengerDash.classList.add('hidden');
            adminPanel.classList.add('hidden');
            await loadDriverDashboard();
        } else {
            passengerDash.classList.remove('hidden');
            driverDash.classList.add('hidden');
            adminPanel.classList.add('hidden');
            await loadPassengerDashboard();
        }
    }

    // Set minimum datetime for booking
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const dateInput = document.getElementById('bookingDateTime');
    if (dateInput) dateInput.min = now.toISOString().slice(0, 16);
}

// Toggle Password
function togglePassword(inputId) {
    let passInput = document.getElementById(inputId);
    passInput.type = passInput.type === 'password'? 'text' : 'password';
}

// Role Selection Toggle
document.querySelectorAll('input[name="userRole"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const driverFields = document.getElementById('driverFields');
        if (e.target.value === 'driver') {
            driverFields.classList.remove('hidden');
            document.getElementById('vehicleType').required = true;
            document.getElementById('vehicleNumber').required = true;
        } else {
            driverFields.classList.add('hidden');
            document.getElementById('vehicleType').required = false;
            document.getElementById('vehicleNumber').required = false;
        }
    });
});

// Signup
async function handleSignup(e) {
    e.preventDefault();
    let name = document.getElementById('signupName').value.trim();
    let mobile = document.getElementById('signupMobile').value.trim();
    let pass = document.getElementById('signupPass').value;
    let confirmPass = document.getElementById('signupConfirmPass').value;
    let termsChecked = document.getElementById('termsCheck').checked;
    let role = document.querySelector('input[name="userRole"]:checked').value;
    let vehicleType = document.getElementById('vehicleType').value;
    let vehicleNumber = document.getElementById('vehicleNumber').value;

    clearMessages();

    if (!name ||!mobile ||!pass ||!confirmPass) {
        document.getElementById('signupError').innerText = 'Please fill all fields';
        return;
    }
    if (pass!== confirmPass) {
        document.getElementById('signupError').innerText = 'Passwords do not match';
        return;
    }
    if (!termsChecked) {
        document.getElementById('signupError').innerText = 'Please accept terms';
        return;
    }
    if (role === 'driver' && (!vehicleType ||!vehicleNumber)) {
        document.getElementById('signupError').innerText = 'Please fill vehicle details';
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(mobile).get();
        if (userDoc.exists) {
            document.getElementById('signupError').innerText = 'Account already exists';
            return;
        }

        const userData = {
            name: name,
            password: pass,
            role: role,
            loginType: 'Mobile',
            verified: role === 'passenger'? true : false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (role === 'driver') {
            userData.vehicleType = vehicleType;
            userData.vehicleNumber = vehicleNumber;
            userData.rating = 5.0;
            userData.totalRides = 0;
            userData.earnings = 0;
        }

        await db.collection('users').doc(mobile).set(userData);
        document.getElementById('signupSuccess').innerText = 'Account created successfully!';
        setTimeout(showLogin, 1500);
    } catch (error) {
        document.getElementById('signupError').innerText = 'Error: ' + error.message;
    }
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    let mobile = document.getElementById('loginMobile').value.trim();
    let pass = document.getElementById('loginPass').value;

    clearMessages();

    if (!mobile ||!pass) {
        document.getElementById('loginError').innerText = 'Enter mobile & password';
        return;
    }

    try {
        const doc = await db.collection('users').doc(mobile).get();
        if (!doc.exists) {
            document.getElementById('loginError').innerText = 'Account not found';
            return;
        }

        const userData = doc.data();
        if (userData.loginType === 'Google') {
            document.getElementById('loginError').innerText = 'Use Google Login for this account';
            return;
        }

        if (userData.password!== pass) {
            document.getElementById('loginError').innerText = 'Wrong password';
            return;
        }

        currentUserData = { email: mobile,...userData };
        localStorage.setItem('currentUser', mobile);
        showDashboard();
    } catch (error) {
        document.getElementById('loginError').innerText = 'Error: ' + error.message;
    }
}

// Google Login
function handleGoogleLogin() {
    auth.signInWithPopup(provider)
       .then(async (result) => {
            const user = result.user;
            const userDoc = await db.collection('users').doc(user.email).get();

            if (!userDoc.exists) {
                const role = confirm('Are you a Driver? Click OK for Driver, Cancel for Passenger')? 'driver' : 'passenger';
                await db.collection('users').doc(user.email).set({
                    name: user.displayName,
                    photo: user.photoURL,
                    role: role,
                    loginType: 'Google',
                    verified: role === 'passenger'? true : false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await loadUserData(user.email);
        })
       .catch((error) => {
            document.getElementById('loginError').innerText = 'Google login failed: ' + error.message;
        });
}

// Logout - FIX: Clear everything
function handleLogout() {
    auth.signOut().then(() => {
        localStorage.clear();
        currentUserData = null;
        showLogin();
    });
}

// Forgot Password - FIX: Real Firebase Reset
async function showForgot() {
    const email = prompt('Enter your email or mobile number to reset password:');
    if (!email) return;

    try {
        // Check if user exists
        const userDoc = await db.collection('users').doc(email).get();
        if (!userDoc.exists) {
            alert('Account not found');
            return;
        }

        const userData = userDoc.data();
        if (userData.loginType === 'Google') {
            alert('Google accounts cannot reset password. Use Google Login.');
            return;
        }

        // For demo: Show password. In production, use Firebase Auth or send OTP
        alert(`Your password is: ${userData.password}\n\nNote: In production, use OTP/Email reset.`);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Admin: Load All Users with Click to View/Edit
async function loadAdminData() {
    const usersSnapshot = await db.collection('users').get();
    let listHTML = '';
    let count = 0;

    usersSnapshot.forEach(doc => {
        count++;
        const user = doc.data();
        let icon = user.loginType === 'Google'? '🔵' : '📱';
        let badge = user.role === 'driver'? '🚗' : '🧑';
        let verifyBadge = user.verified? '✅' : '⚠️';
        listHTML += `<div class="user-item" data-email="${doc.id}" style="padding:12px; border-bottom:1px solid #ddd; cursor:pointer;">
            <b>${count}.</b> ${badge} ${user.name} ${verifyBadge}<br>
            <span style="color:#666; font-size:12px;">${icon} ${doc.id} | ${user.role}</span>
        </div>`;
    });

    document.getElementById('usersList').innerHTML = listHTML || 'No users yet';
    document.getElementById('totalUsers').innerText = count;

    // Add click event to view/edit user
    document.querySelectorAll('.user-item').forEach(item => {
        item.addEventListener('click', () => viewEditUser(item.dataset.email));
    });

    await loadVerificationRequests();
    await loadAllBookings();
}

// Admin: View/Edit User Modal
async function viewEditUser(email) {
    const doc = await db.collection('users').doc(email).get();
    const user = doc.data();

    const newName = prompt(`User: ${user.name}\nEmail/Mobile: ${email}\nRole: ${user.role}\nVerified: ${user.verified}\n\nEnter new name (or cancel):`, user.name);
    if (newName === null) return;

    const newPass = prompt(`Enter new password (or cancel to keep old):`, user.password);
    if (newPass === null) return;

    const newVerified = confirm('Mark as Verified? OK = Yes, Cancel = No');

    try {
        await db.collection('users').doc(email).update({
            name: newName,
            password: newPass,
            verified: newVerified
        });
        alert('User updated successfully!');
        await loadAdminData();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Admin: Load Verification Requests
async function loadVerificationRequests() {
    const container = document.getElementById('verificationRequests');
    const snapshot = await db.collection('verifications').where('status', '==', 'pending').get();

    if (snapshot.empty) {
        container.innerHTML = '<p style="text-align:center;color:#999;">No verification requests</p>';
        return;
    }

    let html = '';
    snapshot.forEach(doc => {
        const v = doc.data();
        html += `
            <div class="booking-card">
                <h5>${v.driverName}</h5>
                <p style="font-size:12px;color:#666;">${v.driverEmail}</p>
                <div style="margin:10px 0;">
                    <a href="${v.licenseUrl}" target="_blank" style="color:#22c55e;">View License</a> |
                    <a href="${v.vehiclePaperUrl}" target="_blank" style="color:#22c55e;">View Papers</a> |
                    <a href="${v.vehiclePhotoUrl}" target="_blank" style="color:#22c55e;">View Photo</a>
                </div>
                <div class="booking-actions">
                    <button class="action-btn primary" onclick="approveVerification('${doc.id}')">Approve</button>
                    <button class="action-btn" onclick="rejectVerification('${doc.id}')">Reject</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Admin: Approve/Reject Verification
async function approveVerification(email) {
    await db.collection('verifications').doc(email).update({ status: 'approved' });
    await db.collection('users').doc(email).update({ verified: true });
    alert('Driver verified!');
    await loadVerificationRequests();
}

async function rejectVerification(email) {
    await db.collection('verifications').doc(email).update({ status: 'rejected' });
    alert('Verification rejected');
    await loadVerificationRequests();
}

// Admin: Load All Bookings
async function loadAllBookings() {
    const container = document.getElementById('allBookingsList');
    const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(50).get();

    if (snapshot.empty) {
        container.innerHTML = '<p style="text-align:center;color:#999;">No bookings found</p>';
        return;
    }

    let html = '';
    snapshot.forEach(doc => {
        const b = doc.data();
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <b>${b.carType} - ৳${b.fare}</b>
                    <span class="status-badge ${b.status}">${b.status.toUpperCase()}</span>
                </div>
                <div class="booking-info" style="font-size:12px;">
                    <div><b>Passenger:</b> ${b.passengerName} (${b.passengerMobile})</div>
                    <div><b>Route:</b> ${b.pickup} → ${b.drop}</div>
                    <div><b>Date:</b> ${new Date(b.dateTime).toLocaleString()}</div>
                    ${b.driverName? `<div><b>Driver:</b> ${b.driverName} (${b.driverMobile})</div>` : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Passenger Dashboard Functions - Add your booking logic here
async function loadPassengerDashboard() {
    document.getElementById('navTab2').innerText = 'Bookings';
    document.getElementById('navTabCenter').innerText = 'Book';
    await loadMyBookings();
}

async function loadMyBookings() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    const snapshot = await db.collection('bookings')
       .where('passengerEmail', '==', currentUserData.email)
       .orderBy('createdAt', 'desc')
       .get();

    if (snapshot.empty) {
        bookingsList.innerHTML = '<p style="text-align:center;color:#999;">No bookings yet</p>';
        return;
    }

    let html = '';
    snapshot.forEach(doc => {
        const b = doc.data();
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <b>${b.carType}</b>
                    <span class="status-badge ${b.status}">${b.status.toUpperCase()}</span>
                </div>
                <div class="booking-info">
                    <div><span class="dot green"></span> ${b.pickup}</div>
                    <div><span class="dot red"></span> ${b.drop}</div>
                    <div>📅 ${new Date(b.dateTime).toLocaleString()}</div>
                    <div>💰 ৳ ${b.fare}</div>
                </div>
            </div>
        `;
    });
    bookingsList.innerHTML = html;
}

// Driver Dashboard Functions
async function loadDriverDashboard() {
    document.getElementById('navTab2').innerText = 'Requests';
    document.getElementById('navTabCenter').innerText = 'Rides';

    if (!currentUserData.verified) {
        document.getElementById('driverWarning').classList.remove('hidden');
        document.getElementById('driverUploadSection').classList.remove('hidden');
    } else {
        document.getElementById('driverWarning').classList.add('hidden');
        document.getElementById('driverUploadSection').classList.add('hidden');
    }

    document.getElementById('todayEarning').innerText = `৳ ${currentUserData.earnings || 0}`;
    document.getElementById('totalRides').innerText = currentUserData.totalRides || 0;
    document.getElementById('driverRating').innerText = `⭐ ${currentUserData.rating || 5.0}`;
}

// Admin Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-content').forEach(c => c.classList.add('hidden'));
        e.target.classList.add('active');
        document.getElementById('admin' + e.target.dataset.tab.charAt(0).toUpperCase() + e.target.dataset.tab.slice(1)).classList.remove('hidden');
    });
});

// Export Users
function exportUsers() {
    db.collection('users').get().then(snapshot => {
        let text = 'HB Ride - User List\n\n';
        let count = 0;
        snapshot.forEach(doc => {
            count++;
            const user = doc.data();
            text += `${count}. Name: ${user.name}\n ID: ${doc.id}\n Password: ${user.password}\n Type: ${user.loginType || 'Mobile'}\n Role: ${user.role}\n Verified: ${user.verified}\n\n`;
        });
        let blob = new Blob([text], { type: 'text/plain' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'hb_ride_users.txt';
        a.click();
    });
}

function clearMessages() {
    document.querySelectorAll('.error,.success').forEach(e => e.innerText = '');
}

// Event Listeners
loginForm?.addEventListener('submit', handleLogin);
signupForm?.addEventListener('submit', handleSignup);
googleLoginBtn?.addEventListener('click', handleGoogleLogin);
googleSignupBtn?.addEventListener('click', handleGoogleLogin);
logoutBtn?.addEventListener('click', handleLogout);
showSignupBtn?.addEventListener('click', showSignup);
backToLoginBtn?.addEventListener('click', showLogin);
backToLoginBtn2?.addEventListener('click', showLogin);
forgotBtn?.addEventListener('click', showForgot);
toggleLoginPass?.addEventListener('click', () => togglePassword('loginPass'));
toggleSignupPass1?.addEventListener('click', () => togglePassword('signupPass'));
toggleSignupPass2?.addEventListener('click', () => togglePassword('signupConfirmPass'));
exportUsersBtn?.addEventListener('click', exportUsers);

// Make functions global for onclick
window.approveVerification = approveVerification;
window.rejectVerification = rejectVerification;
