/* === Imports === */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import firebase from "firebase/compat/app";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/* === Firebase Setup === */
/* IMPORTANT: Replace this with your own firebaseConfig when doing challenges */
const firebaseConfig = {
  apiKey: "AIzaSyCyftyLW7Zns0vJy6ot1zLSEn8Q8WSIAT0",
  authDomain: "moody-61d83.firebaseapp.com",
  projectId: "moody-61d83",
  storageBucket: "moody-61d83.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view");
const viewLoggedIn = document.getElementById("logged-in-view");

const signInWithGoogleButtonEl = document.getElementById(
  "sign-in-with-google-btn"
);

const emailInputEl = document.getElementById("email-input");
const passwordInputEl = document.getElementById("password-input");

const signInButtonEl = document.getElementById("sign-in-btn");
const createAccountButtonEl = document.getElementById("create-account-btn");

const signOutButtonEl = document.getElementById("sign-out-btn");

const userProfilePictureEl = document.getElementById("user-profile-picture");
const userGreetingEl = document.getElementById("user-greeting");

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn");
const textareaEl = document.getElementById("post-input");
const postButtonEl = document.getElementById("post-btn");

const allFilterButtonEl = document.getElementById("all-filter-btn");

const filterButtonEls = document.getElementsByClassName("filter-btn");

const postsEl = document.getElementById("posts");

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle);

signInButtonEl.addEventListener("click", authSignInWithEmail);
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail);

signOutButtonEl.addEventListener("click", authSignOut);

for (let moodEmojiEl of moodEmojiEls) {
  moodEmojiEl.addEventListener("click", selectMood);
}

for (let filterButtonEl of filterButtonEls) {
  filterButtonEl.addEventListener("click", selectFilter);
}

postButtonEl.addEventListener("click", postButtonPressed);

/* === State === */

let moodState = 0;

/* === Global Constants === */

const collectionName = "posts";

/* === Main Code === */

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView();
    showProfilePicture(userProfilePictureEl, user);
    showUserGreeting(userGreetingEl, user);
    fetchInRealtimeAndRenderPostsFromDB(user);
  } else {
    showLoggedOutView();
  }
});

/* === Functions === */

/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Signed in with Google");
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function authSignInWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      clearAuthFields();
      console.log("Signed in with email!");
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function authCreateAccountWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      clearAuthFields();
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function authSignOut() {
  signOut(auth)
    .then(() => {})
    .catch((error) => {
      console.error(error.message);
    });
}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody, user) {
  try {
    // Add a new document in collection "cities"
    const docRef = await addDoc(collection(db, collectionName), {
      body: postBody,
      uid: user.uid,
      createdAt: serverTimestamp(),
      mood: moodState,
    });

    console.log("Document written with ID: ", docRef.id);
    console.log(`The data is ${user.uid}`);
  } catch (error) {
    console.error(error.message);
  }
}

function fetchInRealtimeAndRenderPostsFromDB(user) {
  const postsRef = collection(db, collectionName);
  const q = query(
    postsRef,
    where("uid", "==", user.uid),
    orderBy("createdAt", "desc")
  );
  onSnapshot(q, (querySnapshot) => {
    clearAll(postsEl);

    querySnapshot.forEach((doc) => {
      renderPost(postsEl, doc.data());
    });
  });
}

function fetchTodayPosts(user) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours = (23, 59, 59, 99);

  const postsRef = collection(db, collectionName);

  const q = query(
    postsRef,
    where("uid", "==", user.uid),
    where("createdAt", ">=", startOfDay),
    where("createdAt", "<=", endOfDay),
    orderBy("createdAt", "desc")
  );
  console.log(endOfDay, q);
}
fetchTodayPosts();
/* == Functions - UI Functions == */

function renderPost(postsEl, postData) {
  postsEl.innerHTML += `
   <div class="post">
       <div class="header">
         <h3>${displayDate(postData.createdAt)}</h3>                       
            <img src="assets/emojis/${postData.mood}.png">
               </div>             
                 <p>
                    ${replaceNewlinesWithBrTags(postData.body)}         
                </p>                       
  </div>  
   `;
}

function replaceNewlinesWithBrTags(inputString) {
  // Challenge: Use the replace method on inputString to replace newlines with break tags and return the result

  return inputString.replace(/\n/g, "<br>");
}

function postButtonPressed() {
  const postBody = textareaEl.value;
  const user = auth.currentUser;
  if (postBody && moodState) {
    addPostToDB(postBody, user);
    clearInputField(textareaEl);
    resetAllMoodElements(moodEmojiEls);
    //   console.log(user)
  }
}

function clearAll(element) {
  element.innerHTML = "";
}

function showLoggedOutView() {
  hideView(viewLoggedIn);
  showView(viewLoggedOut);
}

function showLoggedInView() {
  hideView(viewLoggedOut);
  showView(viewLoggedIn);
}

function showView(view) {
  view.style.display = "flex";
}

function hideView(view) {
  view.style.display = "none";
}

function clearInputField(field) {
  field.value = "";
}

function clearAuthFields() {
  clearInputField(emailInputEl);
  clearInputField(passwordInputEl);
}

function showProfilePicture(imgElement, user) {
  const photoURL = user.photoURL;

  if (photoURL) {
    imgElement.src = photoURL;
  } else {
    imgElement.src = "assets/images/default-profile-picture.jpeg";
  }
}

function showUserGreeting(element, user) {
  const displayName = user.displayName;

  if (displayName) {
    const userFirstName = displayName.split(" ")[0];

    element.textContent = `Hey ${userFirstName}, how are you?`;
  } else {
    element.textContent = `Hey friend, how are you?`;
  }
}

function displayDate(firebaseDate) {
  if (!firebaseDate) {
    return "Date processing";
  }
  const date = firebaseDate.toDate();

  const day = date.getDate();
  const year = date.getFullYear();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];

  let hours = date.getHours();
  let minutes = date.getMinutes();
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${day} ${month} ${year} - ${hours}:${minutes}`;
}

/* = Functions - UI Functions - Mood = */

function selectMood(event) {
  const selectedMoodEmojiElementId = event.currentTarget.id;

  changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls);

  const chosenMoodValue = returnMoodValueFromElementId(
    selectedMoodEmojiElementId
  );

  moodState = chosenMoodValue;
}

function changeMoodsStyleAfterSelection(
  selectedMoodElementId,
  allMoodElements
) {
  for (let moodEmojiEl of moodEmojiEls) {
    if (selectedMoodElementId === moodEmojiEl.id) {
      moodEmojiEl.classList.remove("unselected-emoji");
      moodEmojiEl.classList.add("selected-emoji");
    } else {
      moodEmojiEl.classList.remove("selected-emoji");
      moodEmojiEl.classList.add("unselected-emoji");
    }
  }
}

function resetAllMoodElements(allMoodElements) {
  for (let moodEmojiEl of allMoodElements) {
    moodEmojiEl.classList.remove("selected-emoji");
    moodEmojiEl.classList.remove("unselected-emoji");
  }

  moodState = 0;
}

function returnMoodValueFromElementId(elementId) {
  return Number(elementId.slice(5));
}

/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons) {
  for (let filterButtonEl of allFilterButtons) {
    filterButtonEl.classList.remove("selected-filter");
  }
}

function updateFilterButtonStyle(element) {
  element.classList.add("selected-filter");
}

function selectFilter(event) {
  const user = auth.currentUser;

  const selectedFilterElementId = event.target.id;

  const selectedFilterPeriod = selectedFilterElementId.split("-")[0];

  const selectedFilterElement = document.getElementById(
    selectedFilterElementId
  );

  resetAllFilterButtons(filterButtonEls);

  updateFilterButtonStyle(selectedFilterElement);
}
