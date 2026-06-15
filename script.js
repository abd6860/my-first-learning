// Check if already logged in
if(localStorage.getItem('currentUser')) {
    showDashboard();
}

function showLogin() {
    document.querySelectorAll('.container').forEach(e => e.classList.add('hidden'));
    document.getElementById('loginBox').classList.remove('hidden');
    clearMessages();
}

function showSignup() {
    document.querySelectorAll('.container').forEach(e => e.classList.add('hidden'));
    document.getElementById('signupBox').classList.remove('hidden');
    clearMessages();
}

function showForgot() {
    document.querySelectorAll('.container').forEach(e => e.classList.add('hidden'));
    document.getElementById('forgotBox').classList.remove('hidden');
    clearMessages();
}

function showDashboard() {
    document.querySelectorAll('.container').forEach(e => e.classList.add('hidden'));
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('userName').innerText = localStorage.getItem('currentUser');
}

function clearMessages() {
    document.querySelectorAll('.error,.success').forEach(e => e.innerText = '');
}

function signup() {
    let name = document.getElementById('signupName').value.trim();
    let email = document.getElementById('signupEmail').value.trim();
    let pass = document.getElementById('signupPass').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if(!name ||!email ||!pass) {
        document.getElementById('signupError').innerText = 'সব ঘর পূরণ করেন';
        return;
    }

    if(pass.length < 4) {
        document.getElementById('signupError').innerText = 'পাসওয়ার্ড কমপক্ষে 4 অক্ষর হতে হবে';
        return;
    }

    if(users[email]) {
        document.getElementById('signupError').innerText = 'এই ইমেইল দিয়ে একাউন্ট আছে';
        return;
    }

    users[email] = { name: name, password: pass };
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('signupError').innerText = '';
    document.getElementById('signupSuccess').innerText = 'একাউন্ট তৈরি হয়েছে! লগিন করেন';

    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPass').value = '';

    setTimeout(showLogin, 1500);
}

function login() {
    let email = document.getElementById('loginEmail').value.trim();
    let pass = document.getElementById('loginPass').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if(!email ||!pass) {
        document.getElementById('loginError').innerText = 'ইমেইল ও পাসওয়ার্ড দেন';
        return;
    }

    if(users[email] && users[email].password === pass) {
        localStorage.setItem('currentUser', users[email].name);
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPass').value = '';
        document.getElementById('loginError').innerText = '';
        showDashboard();
    } else {
        document.getElementById('loginError').innerText = 'ইমেইল বা পাসওয়ার্ড ভুল';
    }
}

function resetPassword() {
    let email = document.getElementById('forgotEmail').value.trim();
    let newPass = document.getElementById('newPass').value;
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if(!email ||!newPass) {
        document.getElementById('forgotError').innerText = 'সব ঘর পূরণ করেন';
        return;
    }

    if(!users[email]) {
        document.getElementById('forgotError').innerText = 'এই ইমেইল দিয়ে একাউন্ট নাই';
        return;
    }

    if(newPass.length < 4) {
        document.getElementById('forgotError').innerText = 'পাসওয়ার্ড কমপক্ষে 4 অক্ষর হতে হবে';
        return;
    }

    users[email].password = newPass;
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('forgotError').innerText = '';
    document.getElementById('forgotSuccess').innerText = 'পাসওয়ার্ড চেঞ্জ হয়েছে! লগিন করেন';

    document.getElementById('forgotEmail').value = '';
    document.getElementById('newPass').value = '';

    setTimeout(showLogin, 1500);
}

function logout() {
    localStorage.removeItem('currentUser');
    showLogin();
}