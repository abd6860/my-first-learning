// ⚠️ স্যার, এখানে আপনার এডমিন ইমেইল বসান। গুগল দিয়ে লগিন করলে এই ইমেইল এডমিন হবে
const ADMIN_NUMBER = "dustotuhin2021@gmail.com"; 

function showSignup() {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('signupBox').classList.remove('hidden');
    clearMessages();
}

function showLogin() {
    document.getElementById('signupBox').classList.add('hidden');
    document.getElementById('loginBox').classList.remove('hidden');
    clearMessages();
}

function showDashboard() {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('signupBox').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    let currentUser = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let userData = users[currentUser];

    document.getElementById('userName').innerText = userData?.name || '';

    // গুগল লগিন হলে ফটো দেখাও
    if (userData?.photo) {
        let photoEl = document.getElementById('userPhoto');
        photoEl.src = userData.photo;
        photoEl.style.display = 'block';
    } else {
        document.getElementById('userPhoto').style.display = 'none';
    }

    // শুধু এডমিন হলে ইউজার লিস্ট দেখাবে
    if (currentUser === ADMIN_NUMBER) {
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
