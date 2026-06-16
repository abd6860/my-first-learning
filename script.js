import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'
import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'

// ⚠️ স্যার, এখানে আপনার Firebase Config বসান
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ⚠️ এডমিন ইমেইল
const ADMIN_EMAIL = "dustotuhin2021@gmail.com";

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

// পেজ লোড হলে Google Redirect রেজাল্ট চেক
window.addEventListener('load', () => {
    getRedirectResult(auth).then((result) => {
        if (result) {
            const user = result.user;
            let users = JSON.parse(localStorage.getItem('users') || '{}');
            users[user.email] = {
                name: user.displayName,
                password: 'google_login',
                photo: user.photoURL,
                loginType: 'Google'
            };
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', user.email);
            showDashboard();
        } else if (localStorage.getItem('currentUser')) {
            showDashboard();
        }
    }).catch((error) => {
        console.error("Google Login Error:", error);
        document.getElementById('loginError').innerText = 'Google login failed';
    });
});

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

function showDashboard() {
    loginBox.classList.add('hidden');
    signupBox.classList.add('hidden');
    dashboard.classList.remove('hidden');
    document.body.classList.remove('login-page');
    document.body.classList.add('dashboard-active');

    let currentUser = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let userData = users[currentUser];

    document.getElementById('userNameDisplay').innerText = userData?.name || '';

    const userAvatar = document.getElementById('userAvatar');
    if (userData?.photo) {
        userAvatar.src = userData.photo;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.style.display = 'none';
    }

    // Admin Panel
    if (currentUser === ADMIN_EMAIL) {
        let listHTML = '';
        let count = 0;
        for (let key in users) {
            count++;
            let loginType = users[key].loginType || 'Mobile';
            let icon = loginType === 'Google'? '🔵' : '📱';
            listHTML += `<div style="padding:8px; border-bottom:1px solid #ddd;">
                <b>${count}.</b> ${users[key].name}<br>
                <span style="color:#666; font-size:12px;">${icon} ${key}</span>
            </div>`;
        }
        document.getElementById('usersList').innerHTML = listHTML || 'No users yet';
        document.getElementById('totalUsers').innerText = count;
        document.getElementById('adminPanel').classList.remove('hidden');
    } else {
        document.getElementById('adminPanel').classList.add('hidden');
    }
}

// Toggle Password
function togglePassword(inputId) {
    let passInput = document.getElementById(inputId);
    passInput.type = passInput.type === 'password'? 'text' : 'password';
}

// Signup
function handleSignup(e) {
    e.preventDefault();
    let name = document.getElementById('signupName').value.trim();
    let mobile = document.getElementById('signupMobile').value.trim();
    let pass = document.getElementById('signupPass').value;
    let confirmPass = document.getElementById('signupConfirmPass').value;
    let termsChecked = document.getElementById('termsCheck').checked;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

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
    if (users[mobile]) {
        document.getElementById('signupError').innerText = 'Account already exists';
        return;
    }

    users[mobile] = { name: name, password: pass, loginType: 'Mobile' };
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('signupSuccess').innerText = 'Account created successfully!';
    setTimeout(showLogin, 1500);
}

// Login
function handleLogin(e) {
    e.preventDefault();
    let mobile = document.getElementById('loginMobile').value.trim();
    let pass = document.getElementById('loginPass').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    clearMessages();

    if (!mobile ||!pass) {
        document.getElementById('loginError').innerText = 'Enter mobile & password';
        return;
    }
    if (users[mobile] && users[mobile].loginType === 'Google') {
        document.getElementById('loginError').innerText = 'Use Google Login for this account';
        return;
    }
    if (!users[mobile] || users[mobile].password!== pass) {
        document.getElementById('loginError').innerText = 'Wrong number or password';
        return;
    }

    localStorage.setItem('currentUser', mobile);
    showDashboard();
}

// Google Login
function handleGoogleLogin() {
    signInWithRedirect(auth, provider);
}

// Logout
function handleLogout() {
    signOut(auth).then(() => {
        localStorage.removeItem('currentUser');
        dashboard.classList.add('hidden');
        loginBox.classList.remove('hidden');
        document.body.classList.remove('dashboard-active');
        document.body.classList.add('login-page');
        document.getElementById('loginMobile').value = '';
        document.getElementById('loginPass').value = '';
    }).catch((error) => {
        console.error('Logout Error:', error);
    });
}

// Export Users
function exportUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let text = 'HB Ride - User List\n\n';
    let count = 0;
    for (let key in users) {
        count++;
        text += `${count}. Name: ${users[key].name}\n ID: ${key}\n Type: ${users[key].loginType || 'Mobile'}\n\n`;
    }
    let blob = new Blob([text], { type: 'text/plain' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'hb_ride_users.txt';
    a.click();
}

function clearMessages() {
    document.querySelectorAll('.error,.success').forEach(e => e.innerText = '');
}

function showForgot() {
    alert('Contact admin to reset password');
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
exportUsersBtn.addEventListener('click', exportUsers);    if (currentUser === ADMIN_NUMBER) {
        let listHTML = '';
        let count = 0;
        for (let key in users) {
            count++;
            let loginType = users[key].loginType || 'Mobile';
            let icon = loginType === 'Google'? '🔵' : '📱';
            listHTML += `<div style="padding:8px; border-bottom:1px solid #ddd;">
                <b>${count}.</b> ${users[key].name}<br>
                <span style="color:#666; font-size:12px;">${icon} ${key}</span>
            </div>`;
        }
        document.getElementById('usersList').innerHTML = listHTML || 'No users yet';
        document.getElementById('totalUsers').innerText = count;
        document.getElementById('adminPanel').classList.remove('hidden');
    } else {
        document.getElementById('adminPanel').classList.add('hidden');
    }
}

function togglePass() {
    let passInput = document.getElementById('loginPass');
    passInput.type = passInput.type === 'password'? 'text' : 'password';
}

function toggleSignupPass1() {
    let passInput = document.getElementById('signupPass');
    passInput.type = passInput.type === 'password'? 'text' : 'password';
}

function toggleSignupPass2() {
    let passInput = document.getElementById('signupConfirmPass');
    passInput.type = passInput.type === 'password'? 'text' : 'password';
}

function signup() {
    let name = document.getElementById('signupName').value.trim();
    let mobile = document.getElementById('signupMobile').value.trim();
    let pass = document.getElementById('signupPass').value;
    let confirmPass = document.getElementById('signupConfirmPass').value;
    let termsChecked = document.getElementById('termsCheck').checked;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

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
    if (users[mobile]) {
        document.getElementById('signupError').innerText = 'Account already exists with this number';
        return;
    }

    users[mobile] = {
        name: name,
        password: pass,
        loginType: 'Mobile'
    };
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('signupSuccess').innerText = 'Account created successfully!';
    setTimeout(showLogin, 1500);
}

function login() {
    let mobile = document.getElementById('loginMobile').value.trim();
    let pass = document.getElementById('loginPass').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    clearMessages();

    if (!mobile ||!pass) {
        document.getElementById('loginError').innerText = 'Enter mobile & password';
        return;
    }

    // গুগল দিয়ে একাউন্ট হলে পাসওয়ার্ড দিয়ে লগিন হবে না
    if (users[mobile] && users[mobile].loginType === 'Google') {
        document.getElementById('loginError').innerText = 'Use Google Login for this account';
        return;
    }

    if (!users[mobile] || users[mobile].password!== pass) {
        document.getElementById('loginError').innerText = 'Wrong number or password';
        return;
    }

    localStorage.setItem('currentUser', mobile);
    showDashboard();
}

function logout() {
    localStorage.removeItem('currentUser');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loginBox').classList.remove('hidden');
    document.getElementById('loginMobile').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('userPhoto').style.display = 'none';
}

function clearMessages() {
    document.querySelectorAll('.error,.success').forEach(e => e.innerText = '');
}

// ইউজার লিস্ট ডাউনলোড
function exportUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let text = 'HB Ride - User List\n\n';
    let count = 0;
    for (let key in users) {
        count++;
        text += `${count}. Name: ${users[key].name}\n ID: ${key}\n Type: ${users[key].loginType || 'Mobile'}\n\n`;
    }
    let blob = new Blob([text], {type: 'text/plain'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'hb_ride_users.txt';
    a.click();
}

// Forgot password - আপাতত এলার্ট
function showForgot() {
    alert('Contact admin to reset password');
}

// পেজ লোড হলে চেক
window.onload = function() {
    if (localStorage.getItem('currentUser')) {
        showDashboard();
    }
}
