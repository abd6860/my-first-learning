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

    let mobile = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    document.getElementById('userName').innerText = users[mobile]?.name || '';
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
        document.getElementById('signupError').innerText = 'সব ঘর পূরণ করেন';
        return;
    }
    if (pass!== confirmPass) {
        document.getElementById('signupError').innerText = 'পাসওয়ার্ড মিলছে না';
        return;
    }
    if (!termsChecked) {
        document.getElementById('signupError').innerText = 'শর্তাবলীতে টিক দিন';
        return;
    }
    if (users[mobile]) {
        document.getElementById('signupError').innerText = 'এই নাম্বার দিয়ে একাউন্ট আছে';
        return;
    }

    users[mobile] = { name: name, password: pass };
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('signupSuccess').innerText = 'একাউন্ট তৈরি হয়েছে!';
    setTimeout(showLogin, 1500);
}

function login() {
    let mobile = document.getElementById('loginMobile').value.trim();
    let pass = document.getElementById('loginPass').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    clearMessages();

    if (!mobile ||!pass) {
        document.getElementById('loginError').innerText = 'মোবাইল ও পাসওয়ার্ড দিন';
        return;
    }
    if (!users[mobile] || users[mobile].password!== pass) {
        document.getElementById('loginError').innerText = 'নাম্বার বা পাসওয়ার্ড ভুল';
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
}

function clearMessages() {
    document.querySelectorAll('.error,.success').forEach(e => e.innerText = '');
}

// পেজ লোড হলে চেক
window.onload = function() {
    if (localStorage.getItem('currentUser')) {
        showDashboard();
    }
}
