const bikeData = [
  {
    name: "BMW G310",
    type: "Naked",
    price: "180",
    image: "img/g310.png",
    tag: "Free cancellation",
    cc: "313 cc",
    torque: "28 Nm",
    horsepower: "34 hp"
  },
  {
    name: "TVS RR310",
    type: "Sports",
    price: "190",
    image: "img/tvsrr.png",
    tag: "Free cancellation",
    cc: "312 cc",
    torque: "29 Nm",
    horsepower: "34 hp"
  },
  {
    name: "TVS RTR160",
    type: "Naked",
    price: "120",
    image: "img/rtr160.png",
    tag: "Free cancellation",
    cc: "159 cc",
    torque: "14 Nm",
    horsepower: "16 hp"
  },
  {
    name: "BMW GS310",
    type: "Adventure",
    price: "200",
    image: "img/gs310.png",
    tag: "Free cancellation",
    cc: "313 cc",
    torque: "28 Nm",
    horsepower: "34 hp"
  },
  {
    name: "Honda CBR600rr",
    type: "Sports",
    price: "210",
    image: "img/cbr.png",
    tag: "Free cancellation",
    cc: "599 cc",
    torque: "66 Nm",
    horsepower: "119 hp"
  },
  {
    name: "Yamaha Aerox 155",
    type: "Scooter",
    price: "80",
    image: "img/yama.png",
    tag: "Free cancellation",
    cc: "155 cc",
    torque: "13.9 Nm",
    horsepower: "15 hp"
  },
  {
    name: "Honda PCX",
    type: "Scooter",
    price: "90",
    image: "img/pcx.png",
    tag: "Free cancellation",
    cc: "157 cc",
    torque: "15 Nm",
    horsepower: "16 hp"
  },
  {
    name: "Burgman 400",
    type: "Scooter",
    price: "140",
    image: "img/burg.png",
    tag: "Free cancellation",
    cc: "400 cc",
    torque: "35 Nm",
    horsepower: "29 hp"
  }
];

const destinationData = [
  {
    city: "Mumbai",
    description: "Marine Drive sunsets, Bandra lanes, and sea breeze weekend rides."
  },
  {
    city: "Jaipur",
    description: "Ride through forts, palaces, and colorful old-city streets."
  },
  {
    city: "Delhi",
    description: "Explore India Gate, old bazaars, and broad express roads."
  },
  {
    city: "Manipur",
    description: "Green hills, winding roads, and scenic routes around Loktak Lake."
  }
];

const reviewData = [
  {
    name: "Aman Verma",
    city: "Mumbai",
    text: "Bike was clean, pickup was fast, and booking process was super smooth."
  },
  {
    name: "Priya Sharma",
    city: "Jaipur",
    text: "Great support team and fair pricing. I enjoyed the full day trip."
  },
  {
    name: "Rohit Mehta",
    city: "Delhi",
    text: "Helmet and bike condition were excellent. Will definitely book again."
  },
  {
    name: "Nikita Singh",
    city: "Manipur",
    text: "Loved the ride quality and easy payment flow. Highly recommended."
  }
];

const createBikeBox = (bike) => `
<div class="bike-box">
    <img src="${bike.image}" alt="${bike.name}" class="bike-img">
    <div class="bike-content">
        <span class="tag">${bike.tag}</span>
        <div class="title-price">
            <div class="title-data">
                <h2>${bike.name}</h2>
                <p>${bike.type}</p>
            </div>
            <h3 class="bike-price">₹${bike.price}<span>/hour</span></h3>
        </div>
    </div>
    <a href="booking.html?bike=${encodeURIComponent(bike.name)}&price=${bike.price}&img=${encodeURIComponent(
  bike.image
)}&cc=${encodeURIComponent(bike.cc)}&torque=${encodeURIComponent(
  bike.torque
)}&horsepower=${encodeURIComponent(bike.horsepower)}" class="book-btn">
      Book Bike
    </a>
</div>`;

const createDestinationCard = (destination) => `
<article class="destination-card">
  <h3>${destination.city}</h3>
  <p>${destination.description}</p>
</article>`;

const createReviewCard = (review) => `
<article class="review-card">
  <h3>${review.name}</h3>
  <span>${review.city}</span>
  <p>${review.text}</p>
</article>`;

const bikesContainer = document.querySelector(".bikes-content");
if (bikesContainer) {
  bikeData.forEach((bike) => {
    bikesContainer.insertAdjacentHTML("beforeend", createBikeBox(bike));
  });
}

const destinationContainer = document.querySelector(".destination-content");
if (destinationContainer) {
  destinationData.forEach((destination) => {
    destinationContainer.insertAdjacentHTML("beforeend", createDestinationCard(destination));
  });
}

const reviewsContainer = document.querySelector(".reviews-content");
if (reviewsContainer) {
  reviewData.forEach((review) => {
    reviewsContainer.insertAdjacentHTML("beforeend", createReviewCard(review));
  });
}

const menu = document.querySelector(".menu-icon");
if (menu) {
  menu.onclick = () => {
    menu.classList.toggle("move");
  };
}