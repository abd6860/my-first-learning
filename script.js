// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZtof8PCCAGqGGuPkH_aNSsIayEDLru3U",
  authDomain: "hb-ride-a9b5d.firebaseapp.com",
  projectId: "hb-ride-a9b5d",
  storageBucket: "hb-ride-a9b5d.firebasestorage.app",
  messagingSenderId: "541954546180",
  appId: "1:541954546180:web:b176f507a4271add44b351"
};

// Initialize Firebase

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let isSignup = false;
let currentUser = null;

// DOM
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const switchLink = document.getElementById('switchLink');
const nameField = document.getElementById('nameField');
const googleBtn = document.getElementById('googleBtn');
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const userEmail = document.getElementById('userEmail');
const profileEmail = document.getElementById('profileEmail');
const profileName = document.getElementById('profileName');

// Auth state
auth.onAuthStateChanged(user => {
  if(user){
    currentUser = user;
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userEmail.textContent = user.email;
    userEmail.classList.remove('hidden');
    profileEmail.textContent = user.email;
    profileName.textContent = user.displayName || 'N/A';
    authModal.classList.add('hidden');
    showDashboard();
    loadBookings();
  } else {
    currentUser = null;
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userEmail.classList.add('hidden');
    showLanding();
  }
});

// Open modal
loginBtn.onclick = () => {
  isSignup = false;
  setAuthMode();
  authModal.classList.remove('hidden');
}
closeModal.onclick = () => authModal.classList.add('hidden');
menuBtn.onclick = () => mobileMenu.classList.toggle('active');
logoutBtn.onclick = () => auth.signOut();

// Switch Login/Signup
switchLink.onclick = (e) => {
  e.preventDefault();
  isSignup =!isSignup;
  setAuthMode();
}

function setAuthMode(){
  if(isSignup){
    modalTitle.textContent = 'Sign Up';
    submitBtn.textContent = 'Create Account';
    switchLink.textContent = 'Already have account? Login';
    nameField.classList.remove('hidden');
  } else {
    modalTitle.textContent = 'Login';
    submitBtn.textContent = 'Login';
    switchLink.textContent = 'New here? Create account';
    nameField.classList.add('hidden');
  }
  document.getElementById('authError').textContent = '';
}

// Email/Password Auth
submitBtn.onclick = async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const name = document.getElementById('nameInput').value.trim();
  const errorEl = document.getElementById('authError');

  if(!email ||!password){
    errorEl.textContent = 'Email & Password দিন স্যার';
    return;
  }
  if(password.length < 6){
    errorEl.textContent = 'Password 6 character এর বেশি হতে হবে';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait...';

  try{
    if(isSignup){
      const res = await auth.createUserWithEmailAndPassword(email, password);
      if(name) await res.user.updateProfile({displayName: name});
      // Save user to Firestore
      await db.collection('users').doc(res.user.uid).set({
        email, name, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  }catch(err){
    errorEl.textContent = getErrorMessage(err.code);
    submitBtn.disabled = false;
    submitBtn.textContent = isSignup? 'Create Account' : 'Login';
  }
}

// Google Sign-in
googleBtn.onclick = async () => {
  try{
    await auth.signInWithPopup(googleProvider);
  }catch(err){
    document.getElementById('authError').textContent = 'Google login failed: ' + err.message;
  }
}

function getErrorMessage(code){
  const map = {
    'auth/email-already-in-use': 'এই email দিয়ে account আছে',
    'auth/invalid-email': 'ভুল email format',
    'auth/weak-password': 'Password খুব weak',
    'auth/user-not-found': 'User পাওয়া যায়নি',
    'auth/wrong-password': 'ভুল password'
  };
  return map[code] || 'Error: ' + code;
}

// Booking logic same as before
document.getElementById('searchBtn').onclick = async () => {
  if(!currentUser){alert('স্যার, আগে login করুন');authModal.classList.remove('hidden');return}
  const car = document.getElementById('carSelect').value;
  const pickup = document.getElementById('pickup').value;
  const drop = document.getElementById('drop').value;
  const datetime = document.getElementById('datetime').value;
  if(!car ||!pickup ||!drop ||!datetime){alert('সব field পূরণ করুন');return}

  await db.collection('bookings').add({
    userId: currentUser.uid,
    email: currentUser.email,
    carType: car, pickup, drop, datetime,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert('Booking successful!');
  loadBookings();
}

async function loadBookings(){
  if(!currentUser) return;
  const snap = await db.collection('bookings')
   .where('userId','==',currentUser.uid)
   .orderBy('createdAt','desc').limit(10).get();
  const bookingList = document.getElementById('bookingList');
  if(snap.empty){bookingList.innerHTML = '<p>No bookings yet</p>';return}
  bookingList.innerHTML = '';
  snap.forEach(doc=>{
    const b = doc.data();
    bookingList.innerHTML += `<div class="booking-item"><b>${b.carType}</b><br>${b.pickup} → ${b.drop}<br><small>${new Date(b.datetime).toLocaleString()} | ${b.status}</small></div>`;
  });
}

function showDashboard(){
  document.getElementById('landingPage').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  mobileMenu.classList.remove('active');
}
function showLanding(){
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('landingPage').classList.remove('hidden');
}

console.log('HB Ride Email+Google Auth ready ✅');
