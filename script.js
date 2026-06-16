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

// Page Load
window.addEventListener('load', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserData(user.email);
            showDashboard();
        } else if (localStorage.getItem('currentUser')) {
            await loadUserData(localStorage.getItem('currentUser'));
            showDashboard();
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
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// UI Functions
function showSignup() {
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
    document.body.classList.add('login-page');
    clearMessages();
}

function showLogin() {
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    document.body.classList.add('login-page');
    clearMessages();
}

async function showDashboard() {
    loginBox.classList.add('hidden');
    signupBox.classList.add('hidden');
    dashboard.classList.remove('hidden');
    document.body.classList.remove('login-page');
    document.body.classList.add('dashboard-active');

    if (!currentUserData) return;

    // User Avatar
    const userAvatar = document.getElementById('userAvatar');
    if (currentUserData.photo) {
        userAvatar.src = currentUserData.photo;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.src = `https://ui-avatars.com/api/?name=${currentUserData.name}&background=22c55e&color=fff`;
        userAvatar.style.display = 'block';
    }

    // Role Based Dashboard
    const passengerDash = document.getElementById('passengerDashboard');
    const driverDash = document.getElementById('driverDashboard');
    const adminPanel = document.getElementById('adminPanel');

    if (currentUserData.email === ADMIN_EMAIL) {
        adminPanel.classList.remove('hidden');
        passengerDash.classList.add('hidden');
        driverDash.classList.add('hidden');
        await loadAdminData();
    } else if (currentUserData.role === 'driver') {
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

    // Set minimum datetime for booking
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('bookingDateTime').min = now.toISOString().slice(0, 16);
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
        } else {
            driverFields.classList.add('hidden');
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
                // New Google user - ask for role
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

// Logout
function handleLogout() {
    auth.signOut().then(() => {
        localStorage.removeItem('currentUser');
        currentUserData = null;
        dashboard.classList.add('hidden');
        loginBox.classList.remove('hidden');
        document.body.classList.remove('dashboard-active');
        document.body.classList.add('login-page');
        document.getElementById('loginMobile').value = '';
        document.getElementById('loginPass').value = '';
    });
}

// Passenger Dashboard
async function loadPassengerDashboard() {
    document.getElementById('navTab2').innerText = 'Bookings';
    document.getElementById('navTabCenter').innerText = 'Book';
    await loadMyBookings();
}

// Driver Dashboard
async function loadDriverDashboard() {
    document.getElementById('navTab2').innerText = 'Requests';
    document.getElementById('navTabCenter').innerText = 'Rides';

    // Check Verification
    if (!currentUserData.verified) {
        document.getElementById('driverWarning').classList.remove('hidden');
        document.getElementById('driverUploadSection').classList.remove('hidden');
    } else {
        document.getElementById('driverWarning').classList.add('hidden');
        document.getElementById('driverUploadSection').classList.add('hidden');
    }

    // Load Stats
    document.getElementById('todayEarning').innerText = `৳ ${currentUserData.earnings || 0}`;
    document.getElementById('totalRides').innerText = currentUserData.totalRides || 0;
    document.getElementById('driverRating').innerText = `⭐ ${currentUserData.rating || 5.0}`;

    await loadPendingBookings();
    await loadAcceptedRides();
}

// Admin Dashboard
async function loadAdminData() {
    const usersSnapshot = await db.collection('users').get();
    let listHTML = '';
    let count = 0;

    usersSnapshot.forEach(doc => {
        count++;
        const user = doc.data();
        let icon = user.loginType === 'Google'? '🔵' : '📱';
        let badge = user.role === 'driver'? '🚗' : '🧑';
        listHTML += `<div style="padding:8px; border-bottom:1px solid #ddd;">
            <b>${count}.</b> ${badge} ${user.name}<br>
            <span style="color:#666; font-size:12px;">${icon} ${doc.id} | ${user.role}</span>
        </div>`;
    });

    document.getElementById('usersList').innerHTML = listHTML || 'No users yet';
    document.getElementById('totalUsers').innerText = count;

    await loadVerificationRequests();
}

// Check Fare
document.getElementById('checkFareBtn')?.addEventListener('click', () => {
    const pickup = document.getElementById('pickupLocation').value;
    const drop = document.getElementById('dropLocation').value;
    const dateTime = document.getElementById('bookingDateTime').value;

    if (!pickup ||!drop ||!dateTime) {
        alert('Please fill all fields');
        return;
    }

    // Simple distance calculation - আপনি Google Maps API ব্যবহার করতে পারেন
    const distance = Math.floor(Math.random() * 50) + 10; // Demo
    const tripType = document.querySelector('input[name="tripType"]:checked').value;
    const multiplier = tripType === 'roundtrip'? 1.8 : 1;

    document.querySelectorAll('.car-card').forEach(card => {
        const pricePerKm = parseFloat(card.dataset.price);
        const fare = Math.round(distance * pricePerKm * multiplier);
        card.querySelector('.car-fare').innerText = `৳ ${fare}`;
    });

    document.getElementById('carSelection').classList.remove('hidden');
    document.getElementById('bookingForm').classList.add('hidden');
});

// Select Car
document.querySelectorAll('.select-car-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.car-card').forEach(c => c.classList.remove('selected'));
        const card = e.target.closest('.car-card');
        card.classList.add('selected');
        selectedCar = card.dataset.car;
        estimatedFare = parseInt(card.querySelector('.car-fare').innerText.replace('৳ ', ''));

        document.getElementById('carSelection').classList.add('hidden');
        document.getElementById('passengerDetails').classList.remove('hidden');
        document.getElementById('totalFare').innerText = `৳ ${estimatedFare}`;
    });
});

// Back to Car Selection
document.getElementById('backToCarBtn')?.addEventListener('click', () => {
    document.getElementById('passengerDetails').classList.add('hidden');
    document.getElementById('carSelection').classList.remove('hidden');
});

// Confirm Booking
document.getElementById('confirmBookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bookingData = {
        passengerEmail: currentUserData.email,
        passengerName: document.getElementById('customerName').value,
        passengerMobile: document.getElementById('customerMobile').value,
        pickup: document.getElementById('pickupLocation').value,
        drop: document.getElementById('dropLocation').value,
        tripType: document.querySelector('input[name="tripType"]:checked').value,
        dateTime: document.getElementById('bookingDateTime').value,
        passengers: document.getElementById('passengerCount').value,
        carType: selectedCar,
        fare: estimatedFare,
        note: document.getElementById('specialNote').value,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('bookings').add(bookingData);
        alert('Booking confirmed! Drivers will contact you soon.');

        // Reset form
        document.getElementById('passengerDetails').classList.add('hidden');
        document.getElementById('bookingForm').classList.remove('hidden');
        document.getElementById('bookingForm').reset();

        await loadMyBookings();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Load My Bookings
async function loadMyBookings() {
    const bookingsList = document.getElementById('bookingsList');
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
        const statusClass = b.status;
        const statusText = b.status.toUpperCase();
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <b>${b.carType}</b>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="booking-info">
                    <div><span class="dot green"></span> ${b.pickup}</div>
                    <div><span class="dot red"></span> ${b.drop}</div>
                    <div>📅 ${new Date(b.dateTime).toLocaleString()}</div>
                    <div>💰 ৳ ${b.fare}</div>
                </div>
                ${b.driverName? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;">
                    <small>Driver: ${b.driverName} | ${b.driverMobile}</small>
                </div>` : ''}
            </div>
        `;
    });
    bookingsList.innerHTML = html;
}

// Load Pending Bookings for Driver
async function loadPendingBookings() {
    const list = document.getElementById('pendingBookingsList');
    const snapshot = await db.collection('bookings')
       .where('status', '==', 'pending')
       .where('carType', '==', currentUserData.vehicleType)
       .get();

    document.getElementById('pendingCount').innerText = snapshot.size;

    if (snapshot.empty) {
        list.innerHTML = '<p style="text-align:center;color:#999;">No pending requests</p>';
        return;
    }

    let html = '';
    snapshot.forEach(doc => {
        const b = doc.data();
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <b>${b.passengerName}</b>
                    <span class="status-badge pending">NEW</span>
                </div>
                <div class="booking-info">
                    <div><span class="dot green"></span> ${b.pickup}</div>
                    <div><span class="dot red"></span> ${b.drop}</div>
                    <div>📅 ${new Date(b.dateTime).toLocaleString()}</div>
                    <div>💰 ৳ ${b.fare}</div>
                    <div>👥 ${b.passengers} Passengers</div>
                </div>
                <div class="booking-actions">
                    <button class="action-btn primary" onclick="acceptBooking('${doc.id}')">Accept</button>
                    <button class="action-btn" onclick="rejectBooking('${doc.id}')">Reject</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// Accept Booking
async function acceptBooking(bookingId) {
    try {
        await db.collection('bookings').doc(bookingId).update({
            status: 'accepted',
            driverEmail: currentUserData.email,
            driverName: currentUserData.name,
            driverMobile: currentUserData.email,
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Notify other drivers
        const booking = await db.collection('bookings').doc(bookingId).get();
        const otherDrivers = await db.collection('users')
           .where('role', '==', 'driver')
           .where('vehicleType', '==', currentUserData.vehicleType)
           .get();

        otherDrivers.forEach(async (doc) => {
            if (doc.id!== currentUserData.email) {
                await db.collection('notifications').add({
                    userEmail: doc.id,
                    title: 'Booking Already Accepted',
                    message: `A ride from ${booking.data().pickup} to ${booking.data().drop} has been accepted by another driver.`,
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        alert('Booking accepted successfully!');
        await loadPendingBookings();
        await loadAcceptedRides();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Reject Booking
async function rejectBooking(bookingId) {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    try {
        await db.collection('bookings').doc(bookingId).update({
            status: 'rejected',
            rejectedBy: firebase.firestore.FieldValue.arrayUnion(currentUserData.email)
        });
        await loadPendingBookings();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Load Accepted Rides
async function loadAcceptedRides() {
    const list = document.getElementById('acceptedRidesList');
    const snapshot = await db.collection('bookings')
       .where('driverEmail', '==', currentUserData.email)
       .where('status', '==', 'accepted')
       .get();

    if (snapshot.empty) {
        list.innerHTML = '<p style="text-align:center;color:#999;">No active rides</p>';
        return;
    }

    let html = '';
    snapshot.forEach(doc => {
        const b = doc.data();
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <b>${b.passengerName}</b>
                    <span class="status-badge accepted">ACTIVE</span>
                </div>
                <div class="booking-info">
                    <div><span class="dot green"></span> ${b.pickup}</div>
                    <div><span class="dot red"></span> ${b.drop}</div>
                    <div>📅 ${new Date(b.dateTime).toLocaleString()}</div>
                    <div>💰 ৳ ${b.fare}</div>
                    <div>📱 ${b.passengerMobile}</div>
                </div>
                <div class="booking-actions">
                    <button class="action-btn primary" onclick="completeRide('${doc.id}')">Complete Ride</button>
                    <button class="action-btn" onclick="callPassenger('${b.passengerMobile}')">Call</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// Complete Ride
async function completeRide(bookingId) {
    if (!confirm('Mark this ride as completed?')) return;

    try {
        const booking = await db.collection('bookings').doc(bookingId).get();
        const fare = booking.data().fare;

        await db.collection('bookings').doc(bookingId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update driver earnings
        await db.collection('users').doc(currentUserData.email).update({
            earnings: firebase.firestore.FieldValue.increment(fare),
            totalRides: firebase.firestore.FieldValue.increment(1)
        });

        alert('Ride completed! Earnings added to your account.');
        await loadAcceptedRides();
        await loadDriverDashboard();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Call Passenger
function callPassenger(mobile) {
    window.location.href = `tel:${mobile}`;
}

// Document Upload for Driver Verification
document.getElementById('documentUploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const licenseFile = document.getElementById('licenseFile').files[0];
    const vehicleFile = document.getElementById('vehicleFile').files[0];
    const vehiclePhoto = document.getElementById('vehiclePhoto').files[0];

    if (!licenseFile ||!vehicleFile ||!vehiclePhoto) {
        alert('Please upload all documents');
        return;
    }

    try {
        const storageRef = storage.ref();
        const licenseRef = storageRef.child(`verifications/${currentUserData.email}/license`);
        const vehicleRef = storageRef.child(`verifications/${currentUserData.email}/vehicle_paper`);
        const photoRef = storageRef.child(`verifications/${currentUserData.email}/vehicle_photo`);

        await licenseRef.put(licenseFile);
        await vehicleRef.put(vehicleFile);
        await photoRef.put(vehiclePhoto);

        const licenseUrl = await licenseRef.getDownloadURL();
        const vehicleUrl = await vehicleRef.getDownloadURL();
        const photoUrl = await photoRef.getDownloadURL();

        await db.collection('verifications').doc(currentUserData.email).set({
            driverEmail: currentUserData.email,
            driverName: currentUserData.name,
            licenseUrl: licenseUrl,
            vehiclePaperUrl: vehicleUrl,
            vehiclePhotoUrl: photoUrl,
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('documentUploadForm').classList.add('hidden');
        document.getElementById('verificationPending').classList.remove('hidden');
    } catch (error) {
        alert('Error uploading: ' + error.message);
    }
});

// Load Verification Requests for Admin
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

// Approve Verification
async function approveVerification(email) {
    try {
        await db.collection('verifications').doc(email).update({ status: 'approved' });
        await db.collection('users').doc(email).update({ verified: true });
        alert('Driver verified successfully!');
        await loadVerificationRequests();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Reject Verification
async function rejectVerification(email) {
    try {
        await db.collection('verifications').doc(email).update({ status: 'rejected' });
        alert('Verification rejected');
        await loadVerificationRequests();
    } catch (error) {
        alert('Error: ' + error.message);
    }
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
            text += `${count}. Name: ${user.name}\n ID: ${doc.id}\n Type: ${user.loginType || 'Mobile'}\n Role: ${user.role}\n\n`;
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

function showForgot() {
    alert('Contact admin to reset password');
}

// Bottom Nav
document.getElementById('homeNav')?.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('homeNav').classList.add('active');
});

document.getElementById('centerNav')?.addEventListener('click', () => {
    if (currentUserData?.role === 'passenger') {
        document.getElementById('bookingSection').scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('scrollToBooking')?.addEventListener('click', () => {
    document.getElementById('bookingSection').scrollIntoView({ behavior: 'smooth' });
});

// Notification Panel
document.getElementById('notifIcon')?.addEventListener('click', async () => {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('active');
    await loadNotifications();
});

document.getElementById('closeNotif')?.addEventListener('click', () => {
    document.getElementById('notificationPanel').classList.remove('active');
});

async function loadNotifications() {
    const list = document.getElementById('notificationList');
    const snapshot = await db.collection('notifications')
       .where('userEmail', '==', currentUserData.email)
       .orderBy('createdAt', 'desc')
       .limit(20)
       .get();

    if (snapshot.empty) {
        list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No notifications</p>';
        return;
    }

    let html = '';
    let unreadCount = 0;
    snapshot.forEach(doc => {
        const n = doc.data();
        if (!n.read) unreadCount++;
        html += `
            <div class="notification-item ${!n.read? 'unread' : ''}">
                <h5>${n.title}</h5>
                <p>${n.message}</p>
                <span>${new Date(n.createdAt?.toDate()).toLocaleString()}</span>
            </div>
        `;
    });
    list.innerHTML = html;
    document.getElementById('notifCount').innerText = unreadCount;
}

// Real-time Notifications Listener
if (currentUserData) {
    db.collection('notifications')
       .where('userEmail', '==', currentUserData.email)
       .where('read', '==', false)
       .onSnapshot(snapshot => {
            document.getElementById('notifCount').innerText = snapshot.size;
        });
}

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
googleLoginBtn.addEventListener('click', handleGoogleLogin);
googleSignupBtn.addEventListener('click', handleGoogleLogin);
logoutBtn.addEventListener('click', handleLogout);
showSignupBtn.addEventListener('click', showSignup);
backToLoginBtn.addEventListener('click', showLogin);
backToLoginBtn2.addEventListener('click', showLogin);
forgotBtn.addEventListener('click', showForgot);
toggleLoginPass.addEventListener('click', () => togglePassword('loginPass'));
toggleSignupPass1.addEventListener('click', () => togglePassword('signupPass'));
toggleSignupPass2.addEventListener('click', () => togglePassword('signupConfirmPass'));
exportUsersBtn.addEventListener('click', exportUsers);
