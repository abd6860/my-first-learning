// ===== FIREBASE CONFIG - আপনার config বসান স্যার =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global
let confirmationResult = null;
let currentUser = null;

// DOM
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyBtn = document.getElementById('verifyBtn');
const phoneStep = document.getElementById('phoneStep');
const otpStep = document.getElementById('otpStep');
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const dashboard = document.getElementById('dashboard');
const landingPage = document.getElementById('landingPage');
const userPhone = document.getElementById('userPhone');
const profilePhone = document.getElementById('profilePhone');
const bookingList = document.getElementById('bookingList');

// reCAPTCHA init
window.onload = () => {
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible',
    'callback': () => {}
  });
}

// Auth state listener
auth.onAuthStateChanged(user => {
  if(user){
    currentUser = user;
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userPhone.textContent = user.phoneNumber;
    profilePhone.textContent = user.phoneNumber;
    loginModal.classList.add('hidden');
    showDashboard();
    loadBookings();
  } else {
    currentUser = null;
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userPhone.classList.add('hidden');
    showLanding();
  }
});

// Open modal
loginBtn.onclick = () => loginModal.classList.remove('hidden');
closeModal.onclick = () => loginModal.classList.add('hidden');
menuBtn.onclick = () => mobileMenu.classList.toggle('active');
logoutBtn.onclick = () => auth.signOut();

// Send OTP
sendOtpBtn.onclick = async () => {
  const phone = document.getElementById('phoneInput').value;
  if(phone.length < 10){alert('স্যার, valid 10 digit দিন');return}
  
  const fullPhone = '+880' + phone;
  try{
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';
    confirmationResult = await auth.signInWithPhoneNumber(fullPhone, window.recaptchaVerifier);
    phoneStep.classList.add('hidden');
    otpStep.classList.remove('hidden');
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = 'Send Code';
  }catch(err){
    alert('OTP পাঠাতে সমস্যা: ' + err.message);
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = 'Send Code';
    window.recaptchaVerifier.render();
  }
}

// Verify OTP
verifyBtn.onclick = async () => {
  const otp = Array.from(document.querySelectorAll('.otp-inputs input')).map(i=>i.value).join('');
  if(otp.length < 6){
    document.getElementById('otpError').textContent = '6 digit OTP দিন';
    return;
  }
  try{
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    await confirmationResult.confirm(otp);
    // User auto logged in via onAuthStateChanged
  }catch(err){
    document.getElementById('otpError').textContent = 'ভুল OTP, আবার চেষ্টা করুন';
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Continue';
  }
}

// OTP auto-focus
document.querySelectorAll('.otp-inputs input').forEach((input,i,arr)=>{
  input.oninput = () => {if(input.value && i<arr.length-1) arr[i+1].focus()}
  input.onkeydown = (e) => {if(e.key=='Backspace' && !input.value && i>0) arr[i-1].focus()}
})

// Booking logic
document.getElementById('searchBtn').onclick = async () => {
  if(!currentUser){alert('স্যার, আগে login করুন');loginModal.classList.remove('hidden');return}
  
  const car = document.getElementById('carSelect').value;
  const pickup = document.getElementById('pickup').value;
  const drop = document.getElementById('drop').value;
  const datetime = document.getElementById('datetime').value;
  
  if(!car || !pickup || !drop || !datetime){
    alert('সব field পূরণ করুন স্যার');
    return;
  }
  
  try{
    await db.collection('bookings').add({
      userId: currentUser.uid,
      phone: currentUser.phoneNumber,
      carType: car,
      pickup,
      drop,
      datetime,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Booking successful! Dashboard এ দেখুন');
    loadBookings();
  }catch(err){
    alert('Booking error: ' + err.message);
  }
}

// Load user bookings
async function loadBookings(){
  if(!currentUser) return;
  bookingList.innerHTML = 'Loading...';
  const snap = await db.collection('bookings')
    .where('userId','==',currentUser.uid)
    .orderBy('createdAt','desc')
    .limit(10)
    .get();
  
  if(snap.empty){
    bookingList.innerHTML = '<p>No bookings yet</p>';
    return;
  }
  bookingList.innerHTML = '';
  snap.forEach(doc=>{
    const b = doc.data();
    const div = document.createElement('div');
    div.className = 'booking-item';
    div.innerHTML = `
      <b>${b.carType}</b><br>
      ${b.pickup} → ${b.drop}<br>
      <small>${new Date(b.datetime).toLocaleString()} | ${b.status}</small>
    `;
    bookingList.appendChild(div);
  });
}

function showDashboard(){
  landingPage.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userPhone.classList.remove('hidden');
  mobileMenu.classList.remove('active');
}
function showLanding(){
  dashboard.classList.add('hidden');
  landingPage.classList.remove('hidden');
  userPhone.classList.add('hidden');
  mobileMenu.classList.remove('active');
}

console.log('HB Ride Firebase connected ✅');
