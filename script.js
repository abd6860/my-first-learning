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

// Helper: Generate Unique Username
function generateUsername(name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}`;
}

// Helper: Check if Email or Mobile
function isEmail(input) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

// Page Load
window.addEventListener('load', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserData(user.email);
            showDashboard();
        } else {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const loaded = await loadUserData(savedUser);
                if (loaded) {
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

// Load User Data
async function loadUserData(identifier) {
    try {
        let doc = await db.collection('users').doc(identifier).get();
        if (!doc.exists) {
            const query = await db.collection('users').where('mobile', '==', identifier).limit(1).get();
            if (!query.empty) {
                doc = query.docs[0];
                identifier = doc.id;
            }
        }
        if (doc.exists) {
            currentUserData = { email: doc.id, ...doc.data() };
            localStorage.setItem('currentUser', doc.id);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// UI Functions
function showSignup() {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('signupBox').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    clearMessages();
}

function showLogin() {
    document.getElementById('signupBox').classList.add('hidden');
    document.getElementById('loginBox').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    clearMessages();
}

async function showDashboard() {
    if (!currentUserData) {
        showLogin();
        return;
    }

    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('signupBox').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    const userAvatar = document.getElementById('userAvatar');
    userAvatar.src = currentUserData.photo || `https://ui-avatars.com/api/?name=${currentUserData.name}&background=22c55e&color=fff`;

    const passengerDash = document.getElementById('passengerDashboard');
    const driverDash = document.getElementById('driverDashboard');
    const adminPanel = document.getElementById('adminPanel');
    const bottomNav = document.querySelector('.bottom-nav');

    if (currentUserData.email === ADMIN_EMAIL) {
        adminPanel.classList.remove('hidden');
        passengerDash.classList.add('hidden');
        driverDash.classList.add('hidden');
        bottomNav.classList.add('hidden');
        await loadAdminData();
    } else if (currentUserData.role === 'driver') {
        driverDash.classList.remove('hidden');
        passengerDash.classList.add('hidden');
        adminPanel.classList.add('hidden');
        bottomNav.classList.remove('hidden');
        await loadDriverDashboard();
    } else {
        passengerDash.classList.remove('hidden');
        driverDash.classList.add('hidden');
        adminPanel.classList.add('hidden');
        bottomNav.classList.remove('hidden');
        await loadPassengerDashboard();
    }
}

// Toggle Password
function togglePassword(inputId) {
    let passInput = document.getElementById(inputId);
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
}

// Role Selection Toggle
document.addEventListener('change', (e) => {
    if (e.target.name === 'userRole') {
        const driverFields = document.getElementById('driverFields');
        if (e.target.value === 'driver') {
            driverFields.classList.remove('hidden');
        } else {
            driverFields.classList.add('hidden');
        }
    }
});

// Signup - FIX: Email/Mobile Both + Auto Username
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let name = document.getElementById('signupName').value.trim();
    let identifier = document.getElementById('signupMobile').value.trim();
    let pass = document.getElementById('signupPass').value;
    let confirmPass = document.getElementById('signupConfirmPass').value;
    let termsChecked = document.getElementById('termsCheck').checked;
    let role = document.querySelector('input[name="userRole"]:checked').value;
    let vehicleType = document.getElementById('vehicleType')?.value;
    let vehicleNumber = document.getElementById('vehicleNumber')?.value;

    clearMessages();

    if (!name || !identifier || !pass || !confirmPass) {
        document.getElementById('signupError').innerText = 'Please fill all fields';
        return;
    }
    if (pass !== confirmPass) {
        document.getElementById('signupError').innerText = 'Passwords do not match';
        return;
    }
    if (!termsChecked) {
        document.getElementById('signupError').innerText = 'Please accept terms';
        return;
    }
    if (role === 'driver' && (!vehicleType || !vehicleNumber)) {
        document.getElementById('signupError').innerText = 'Please fill vehicle details';
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(identifier).get();
        if (userDoc.exists) {
            document.getElementById('signupError').innerText = 'Account already exists';
            return;
        }

        let username = generateUsername(name);
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            const check = await db.collection('users').where('username', '==', username).get();
            if (check.empty) {
                isUnique = true;
            } else {
                username = generateUsername(name);
                attempts++;
            }
        }

        const userData = {
            name: name,
            username: username,
            password: pass,
            role: role,
            loginType: 'Custom',
            verified: role === 'passenger' ? true : false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isEmail(identifier)) {
            userData.email = identifier;
        } else {
            userData.mobile = identifier;
        }

        if (role === 'driver') {
            userData.vehicleType = vehicleType;
            userData.vehicleNumber = vehicleNumber;
            userData.rating = 5.0;
            userData.totalRides = 0;
            userData.earnings = 0;
            userData.cars = []; // Driver এর গাড়ি লিস্ট
        }

        await db.collection('users').doc(identifier).set(userData);
        document.getElementById('signupSuccess').innerText = `Account created! Username: @${username}`;
        setTimeout(showLogin, 2000);
    } catch (error) {
        document.getElementById('signupError').innerText = 'Error: ' + error.message;
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let identifier = document.getElementById('loginMobile').value.trim();
    let pass = document.getElementById('loginPass').value;

    clearMessages();

    if (!identifier || !pass) {
        document.getElementById('loginError').innerText = 'Enter email/mobile & password';
        return;
    }

    try {
        const loaded = await loadUserData(identifier);
        if (!loaded) {
            document.getElementById('loginError').innerText = 'Account not found';
            return;
        }
        if (currentUserData.loginType === 'Google') {
            document.getElementById('loginError').innerText = 'Use Google Login';
            return;
        }
        if (currentUserData.password !== pass) {
            document.getElementById('loginError').innerText = 'Wrong password';
            return;
        }
        showDashboard();
    } catch (error) {
        document.getElementById('loginError').innerText = 'Error: ' + error.message;
    }
});

// Google Login
document.getElementById('googleLoginBtn')?.addEventListener('click', handleGoogleLogin);
document.getElementById('googleSignupBtn')?.addEventListener('click', handleGoogleLogin);

function handleGoogleLogin() {
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            const userDoc = await db.collection('users').doc(user.email).get();
            if (!userDoc.exists) {
                const role = confirm('Are you a Driver? OK = Driver, Cancel = Passenger') ? 'driver' : 'passenger';
                const username = generateUsername(user.displayName);
                await db.collection('users').doc(user.email).set({
                    name: user.displayName,
                    username: username,
                    photo: user.photoURL,
                    email: user.email,
                    role: role,
                    loginType: 'Google',
                    verified: role === 'passenger' ? true : false,
                    cars: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            await loadUserData(user.email);
        })
        .catch((error) => {
            document.getElementById('loginError').innerText = 'Google login failed';
        });
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    auth.signOut().then(() => {
        localStorage.clear();
        currentUserData = null;
        showLogin();
    });
});

// Driver Verification Submit - FIX: Admin এ জমা হবে
document.getElementById('submitVerification')?.addEventListener('click', async () => {
    const licenseFile = document.getElementById('licensePhoto').files[0];
    const papersFile = document.getElementById('vehiclePapers').files[0];
    const vehiclePhotoFile = document.getElementById('vehiclePhoto').files[0];

    if (!licenseFile || !papersFile || !vehiclePhotoFile) {
        alert('Please upload all documents');
        return;
    }

    try {
        // Upload to Storage
        const licenseRef = storage.ref(`verifications/${currentUserData.email}/license.jpg`);
        const papersRef = storage.ref(`verifications/${currentUserData.email}/papers.jpg`);
        const vehicleRef = storage.ref(`verifications/${currentUserData.email}/vehicle.jpg`);

        await licenseRef.put(licenseFile);
        await papersRef.put(papersFile);
        await vehicleRef.put(vehiclePhotoFile);

        const licenseUrl = await licenseRef.getDownloadURL();
        const papersUrl = await papersRef.getDownloadURL();
        const vehicleUrl = await vehicleRef.getDownloadURL();

        // Save to Firestore
        await db.collection('verifications').doc(currentUserData.email).set({
            driverName: currentUserData.name,
            driverEmail: currentUserData.email,
            driverMobile: currentUserData.mobile || currentUserData.email,
            licenseUrl: licenseUrl,
            vehiclePaperUrl: papersUrl,
            vehiclePhotoUrl: vehicleUrl,
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Documents submitted! Wait for admin approval.');
        document.getElementById('driverUploadSection').classList.add('hidden');
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Driver Add Car - Garibook এর মতো
document.getElementById('addCarBtn')?.addEventListener('click', async () => {
    const carName = prompt('Car Name/Model:');
    if (!carName) return;
    const carNumber = prompt('Car Number:');
    if (!carNumber) return;
    const carPhoto = prompt('Car Photo URL (optional):');

    const newCar = {
        name: carName,
        number: carNumber,
        photo: carPhoto || '',
        addedAt: new Date().toISOString()
    };

    const cars = currentUserData.cars || [];
    cars.push(newCar);

    await db.collection('users').doc(currentUserData.email).update({ cars: cars });
    currentUserData.cars = cars;
    alert('Car added successfully!');
    loadDriverCars();
});

async function loadDriverCars() {
    const container = document.getElementById('driverCarsList');
    if (!container) return;
    
    const cars = currentUserData.cars || [];
    if (cars.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">No cars added</p>';
        return;
    }

    let html = '';
    cars.forEach((car, index) => {
        html += `
            <div class="car-card">
                ${car.photo ? `<img src="${car.photo}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;">` : ''}
                <h5>${car.name}</h5>
                <p>${car.number}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Admin Functions
async function loadAdminData() {
    const usersSnapshot = await db.collection('users').get();
    let listHTML = '';
    let count = 0;

    usersSnapshot.forEach(doc => {
        count++;
        const user = doc.data();
        let icon = user.loginType === 'Google' ? '🔵' : '📱';
        let badge = user.role === 'driver' ? '🚗' : '🧑';
        let verifyBadge = user.verified ? '✅' : '⚠️';
        listHTML += `<div class="user-item" data-email="${doc.id}" style="padding:12px; border-bottom:1px solid #ddd; cursor:pointer;">
            <b>${count}.</b> ${badge} ${user.name} ${verifyBadge}<br>
            <span style="color:#666; font-size:12px;">${icon} ${doc.id} | @${user.username}</span>
        </div>`;
    });

    document.getElementById('usersList').innerHTML = listHTML || 'No users yet';
    document.getElementById('totalUsers').innerText = count;

    document.querySelectorAll('.user-item').forEach(item => {
        item.addEventListener('click', () => viewEditUser(item.dataset.email));
    });

    await loadVerificationRequests();
}

async function viewEditUser(email) {
    const doc = await db.collection('users').doc(email).get();
    const user = doc.data();
    const info = `Name: ${user.name}\nUsername: @${user.username}\nEmail: ${email}\nRole: ${user.role}\nVerified: ${user.verified}\nPassword: ${user.password}\n\nOK to Edit?`;
    if (!confirm(info)) return;

    const newName = prompt('New name:', user.name);
    if (newName === null) return;
    const newPass = prompt('New password:', user.password);
    if (newPass === null) return;
    const newVerified = confirm('Mark as Verified?');

    await db.collection('users').doc(email).update({
        name: newName,
        password: newPass,
        verified: newVerified
    });
    alert('Updated!');
    await loadAdminData();
}

async function loadVerificationRequests() {
    const container = document.getElementById('verificationRequests');
    const snapshot = await db.collection('verifications').where('status', '==', 'pending').get();

    if (snapshot.empty) {
        container.innerHTML = '<p style="text-align:center;color:#999;">No requests</p>';
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
                    <a href="${v.licenseUrl}" target="_blank">License</a> |
                    <a href="${v.vehiclePaperUrl}" target="_blank">Papers</a> |
                    <a href="${v.vehiclePhotoUrl}" target="_blank">Photo</a>
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

window.approveVerification = async (email) => {
    await db.collection('verifications').doc(email).update({ status: 'approved' });
    await db.collection('users').doc(email).update({ verified: true });
    alert('Approved!');
    await loadVerificationRequests();
};

window.rejectVerification = async (email) => {
    await db.collection('verifications').doc(email).update({ status: 'rejected' });
    alert('Rejected');
    await loadVerificationRequests();
};

// Driver Dashboard
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
    await loadDriverCars();
}

// Passenger Dashboard
async function loadPassengerDashboard() {
    document.getElementById('navTab2').innerText = 'Bookings';
    document.getElementById('navTabCenter').innerText = 'Book';
}

// Admin Tabs
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-content').forEach(c => c.classList.add('hidden'));
        e.target.classList.add('active');
        document.getElementById('admin' + e.target.dataset.tab.charAt(0).toUpperCase() + e.target.dataset.tab.slice(1)).classList.remove('hidden');
    }
});

function clearMessages() {
    document.querySelectorAll('.error,.success').forEach(e => e.innerText = '');
}

// Other Event Listeners
document.getElementById('showSignupBtn')?.addEventListener('click', showSignup);
document.getElementById('backToLoginBtn')?.addEventListener('click', showLogin);
document.getElementById('backToLoginBtn2')?.addEventListener('click', showLogin);
document.getElementById('toggleLoginPass')?.addEventListener('click', () => togglePassword('loginPass'));
document.getElementById('toggleSignupPass1')?.addEventListener('click', () => togglePassword('signupPass'));
document.getElementById('toggleSignupPass2')?.addEventListener('click', () => togglePassword('signupConfirmPass'));
