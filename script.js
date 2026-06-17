const firebaseConfig = {
    apiKey: "AIzaSyBZtof8PCCAGqGGuPkH_aNSsIayEDLru3U",
    authDomain: "hb-ride-a9b5d.firebaseapp.com",
    projectId: "hb-ride-a9b5d",
    storageBucket: "hb-ride-a9b5d.firebasestorage.app",
    messagingSenderId: "541954546180",
    appId: "1:541954546180:web:b176f507a4271add44b351"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();
const ADMIN_EMAIL = "dustotuhin2021@gmail.com";

let currentUserData = null;
let selectedCar = null;

// Helpers
const $ = id => document.getElementById(id);
const show = el => el.classList.remove('hidden');
const hide = el => el.classList.add('hidden');
const generateUsername = name => name.toLowerCase().replace(/[^a-z0-9]/g,'') + Math.floor(1000+Math.random()*9000);
const isEmail = str => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// Auth State
auth.onAuthStateChanged(async user=>{
  if(user){
    await loadUserData(user.email);
    showApp();
  }else{
    hide($('app')); show($('landing'));
    $('navAuthBtn').innerText='Login';
  }
});

async function loadUserData(email){
  let doc = await db.collection('users').doc(email).get();
  if(!doc.exists){
    let q = await db.collection('users').where('mobile','==',email).limit(1).get();
    if(!q.empty){doc=q.docs[0]; email=doc.id;}
  }
  if(doc.exists) currentUserData={email:doc.id,...doc.data()};
}

// Show App based on role
function showApp(){
  hide($('landing')); show($('app')); hide($('authModal'));
  $('userAvatar').src=currentUserData.photo||`https://ui-avatars.com/api/?name=${currentUserData.name}&background=22c55e&color=fff`;
  $('navAuthBtn').innerText='Dashboard';

  if(currentUserData.email===ADMIN_EMAIL){
    show($('adminPanel')); hide($('passengerDashboard')); hide($('driverDashboard')); loadAdminData();
  }else if(currentUserData.role==='driver'){
    show($('driverDashboard')); hide($('passengerDashboard')); hide($('adminPanel')); loadDriver();
  }else{
    show($('passengerDashboard')); hide($('driverDashboard')); hide($('adminPanel')); loadPassenger();
  }
}

// Auth Modal
$('navAuthBtn').onclick=()=>{ if(auth.currentUser) showApp(); else show($('authModal')); }
$('closeModal').onclick=()=>hide($('authModal'));
$('showSignupBtn').onclick=()=>{hide($('loginBox'));show($('signupBox'))};
$('backToLoginBtn').onclick=()=>{hide($('signupBox'));show($('loginBox'))};
document.querySelectorAll('input[name="userRole"]').forEach(r=>r.onchange=e=>{$('driverFields').classList.toggle('hidden',e.target.value!=='driver')});

// Signup
$('signupForm').onsubmit=async e=>{
  e.preventDefault();
  const name=$('signupName').value.trim(), id=$('signupMobile').value.trim(), pass=$('signupPass').value, cpass=$('signupConfirmPass').value, role=document.querySelector('input[name="userRole"]:checked').value;
  if(pass!==cpass){$('signupError').innerText='Passwords mismatch';return;}
  if(!$('termsCheck').checked){$('signupError').innerText='Accept terms';return;}
  if(await db.collection('users').doc(id).get().then(d=>d.exists)){$('signupError').innerText='Account exists';return;}

  const userData={name,username:generateUsername(name),password:pass,role,verified:role==='passenger',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
  if(isEmail(id)) userData.email=id; else userData.mobile=id;
  if(role==='driver') Object.assign(userData,{vehicleType:$('vehicleType').value,vehicleNumber:$('vehicleNumber').value,rating:5,totalRides:0,earnings:0,cars:[]});

  await db.collection('users').doc(id).set(userData);
  $('signupSuccess').innerText='Account created! Login now';
  setTimeout(()=>{$('backToLoginBtn').click()},1500);
};

// Login
$('loginForm').onsubmit=async e=>{
  e.preventDefault();
  const id=$('loginMobile').value.trim(),pass=$('loginPass').value;
  await loadUserData(id);
  if(!currentUserData){$('loginError').innerText='Account not found';return;}
  if(currentUserData.password!==pass){$('loginError').innerText='Wrong password';return;}
  auth.signInAnonymously(); // session only
};

// Google
$('googleLoginBtn').onclick=()=>auth.signInWithPopup(provider).then(async r=>{
  const u=r.user; if(!(await db.collection('users').doc(u.email).get()).exists){
    await db.collection('users').doc(u.email).set({name:u.displayName,username:generateUsername(u.displayName),email:u.email,photo:u.photoURL,role:'passenger',verified:true,loginType:'Google',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  }
});

// Logout
$('logoutBtn').onclick=()=>{auth.signOut();currentUserData=null;localStorage.clear();location.reload()};

// Passenger
async function loadPassenger(){
  const cars=[{name:'Sedan',price:40},{name:'Hiace',price:70},{name:'Bike',price:15}];
  $('carList').innerHTML=cars.map(c=>`<div class="car-card" data-name="${c.name}" data-price="${c.price}"><div>🚗</div><div><h5>${c.name}</h5><p>From ৳${c.price}/km</p></div></div>`).join('');
  document.querySelectorAll('.car-card').forEach(card=>card.onclick=()=>{
    document.querySelectorAll('.car-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected'); selectedCar=card.dataset;
    const dist=10; $('fareBox').innerHTML=`<p>Car: ${selectedCar.name}</p><p>Est. Fare: ৳${selectedCar.price*dist}</p><p class="note">*For ~10km</p>`; show($('fareBox'));
  });
  $('confirmBooking').onclick=async()=>{
    if(!selectedCar){alert('Select car');return;}
    await db.collection('bookings').add({user:currentUserData.email,pickup:$('pickup').value,drop:$('drop').value,date:$('tripDate').value,car:selectedCar.name,status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    alert('Booking placed!'); loadMyBookings();
  };
  loadMyBookings();
}
async function loadMyBookings(){
  const snap=await db.collection('bookings').where('user','==',currentUserData.email).get();
  $('myBookings').innerHTML=snap.empty?'No bookings':snap.docs.map(d=>`<div class="booking-card"><b>${d.data().car}</b> - ${d.data().status}<br>${d.data().pickup} → ${d.data().drop}</div>`).join('');
}

// Driver
async function loadDriver(){
  $('todayEarning').innerText='৳'+(currentUserData.earnings||0);
  $('totalRides').innerText=currentUserData.totalRides||0;
  $('driverRating').innerText='⭐'+(currentUserData.rating||5);
  $('driverWarning').classList.toggle('hidden',currentUserData.verified);
  $('driverUploadSection').classList.toggle('hidden',currentUserData.verified);
  loadDriverCars();
  db.collection('bookings').where('status','==','pending').onSnapshot(snap=>{
    $('rideRequests').innerHTML=snap.empty?'No requests':snap.docs.map(d=>`<div class="booking-card"><b>${d.data().car}</b><br>${d.data().pickup} → ${d.data().drop}<button onclick="acceptRide('${d.id}')">Accept</button></div>`).join('');
  });
}
window.acceptRide=async id=>{await db.collection('bookings').doc(id).update({status:'accepted',driver:currentUserData.email});};
$('submitVerification').onclick=async()=>{
  const files=[$('licensePhoto').files[0],$('vehiclePapers').files[0],$('vehiclePhoto').files[0]];
  if(files.some(f=>!f)){alert('Upload all');return;}
  const urls=await Promise.all(files.map((f,i)=>storage.ref(`verifications/${currentUserData.email}/${i}.jpg`).put(f).then(()=>storage.ref(`verifications/${currentUserData.email}/${i}.jpg`).getDownloadURL())));
  await db.collection('verifications').doc(currentUserData.email).set({driverName:currentUserData.name,urls,status:'pending',submittedAt:firebase.firestore.FieldValue.serverTimestamp()});
  alert('Submitted');hide($('driverUploadSection'));
};
$('addCarBtn').onclick=async()=>{
  const name=prompt('Car name?'),num=prompt('Number?'); if(!name||!num)return;
  const cars=[...(currentUserData.cars||[]),{name,number:num}];
  await db.collection('users').doc(currentUserData.email).update({cars}); currentUserData.cars=cars; loadDriverCars();
};
function loadDriverCars(){
  $('driverCarsList').innerHTML=(currentUserData.cars||[]).map(c=>`<div class="fleet-card"><h4>${c.name}</h4><p>${c.number}</p></div>`).join('')||'<p>No cars</p>';
}

// Admin
async function loadAdminData(){
  const users=await db.collection('users').get();
  $('totalUsers').innerText=users.size;
  $('usersList').innerHTML=users.docs.map((d,i)=>`<div class="user-item" onclick="editUser('${d.id}')"><b>${i+1}. ${d.data().name}</b><br>${d.id} - ${d.data().role} ${d.data().verified?'✅':'⚠️'}</div>`).join('');
  loadVerifications();
  document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s=>hide(s));
    show($('admin'+b.dataset.tab.charAt(0).toUpperCase()+b.dataset.tab.slice(1)));
  });
}
window.editUser=async email=>{
  const d=await db.collection('users').doc(email).get(); const u=d.data();
  const name=prompt('Name',u.name); if(name===null)return;
  const verified=confirm('Verified?');
  await db.collection('users').doc(email).update({name,verified}); loadAdminData();
};
async function loadVerifications(){
  const snap=await db.collection('verifications').where('status','==','pending').get();
  $('verificationRequests').innerHTML=snap.empty?'No requests':snap.docs.map(d=>`<div class="booking-card"><b>${d.data().driverName}</b><br>${d.data().urls.map(u=>`<a href="${u}" target="_blank">Doc</a>`).join(' | ')}<br><button onclick="approve('${d.id}')">Approve</button><button onclick="reject('${d.id}')">Reject</button></div>`).join('');
}
window.approve=async id=>{await db.collection('verifications').doc(id).update({status:'approved'});await db.collection('users').doc(id).update({verified:true});loadVerifications();};
window.reject=async id=>{await db.collection('verifications').doc(id).update({status:'rejected'});loadVerifications();};

// UX
$('quickBookingForm').onsubmit=e=>{e.preventDefault();$('navAuthBtn').click();};
$('toggleLoginPass').onclick=()=>$('loginPass').type=$('loginPass').type==='password'?'text':'password';
$('toggleSignupPass1').onclick=()=>$('signupPass').type=$('signupPass').type==='password'?'text':'password';
