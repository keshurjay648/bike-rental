const mumbaiDealers = [
  {
    name: "RideAxis Andheri",
    area: "Andheri West, Mumbai",
    contact: "+91 98201 45672"
  },
  {
    name: "Marine Moto Hub",
    area: "Churchgate, Mumbai",
    contact: "+91 98333 28410"
  },
  {
    name: "Throttle Point Dadar",
    area: "Dadar East, Mumbai",
    contact: "+91 98921 77455"
  },
  {
    name: "Powai Bike Garage",
    area: "Powai, Mumbai",
    contact: "+91 98190 63528"
  },
  {
    name: "Bandra Rider Station",
    area: "Bandra West, Mumbai",
    contact: "+91 97680 22941"
  },
  {
    name: "Worli Wheel Works",
    area: "Worli, Mumbai",
    contact: "+91 98204 71936"
  },
  {
    name: "Colaba Cruise Rentals",
    area: "Colaba, Mumbai",
    contact: "+91 99306 16884"
  },
  {
    name: "Vashi Velocity Bikes",
    area: "Vashi, Navi Mumbai",
    contact: "+91 90042 34567"
  },
  {
    name: "Sion Saddle Spot",
    area: "Sion, Mumbai",
    contact: "+91 98703 50129"
  },
  {
    name: "Juhu Urban Riders",
    area: "Juhu, Mumbai",
    contact: "+91 99870 91234"
  },
  {
    name: "Kurla Moto Yard",
    area: "Kurla West, Mumbai",
    contact: "+91 98197 11442"
  },
  {
    name: "Chembur City Riders",
    area: "Chembur, Mumbai",
    contact: "+91 99674 33815"
  },
  {
    name: "Goregaon Trail Bikes",
    area: "Goregaon East, Mumbai",
    contact: "+91 98213 66274"
  },
  {
    name: "Mulund Moto Point",
    area: "Mulund West, Mumbai",
    contact: "+91 98704 41853"
  },
  {
    name: "Thane Highway Rides",
    area: "Thane West, Mumbai Metropolitan Region",
    contact: "+91 98928 27590"
  },
  {
    name: "Malad Rider Hub",
    area: "Malad West, Mumbai",
    contact: "+91 97571 90642"
  },
  {
    name: "Borivali Bike House",
    area: "Borivali East, Mumbai",
    contact: "+91 98193 74026"
  }
];

const dealersGrid = document.getElementById("dealersGrid");

function pickRandomDealers(pool, count) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function renderDealers() {
  const selectedDealers = pickRandomDealers(mumbaiDealers, 7);
  dealersGrid.innerHTML = "";

  selectedDealers.forEach((dealer) => {
    dealersGrid.insertAdjacentHTML(
      "beforeend",
      `
      <article class="dealer-card">
        <h3>${dealer.name}</h3>
        <p>${dealer.area}</p>
        <p class="dealer-contact">${dealer.contact}</p>
      </article>
      `
    );
  });
}

renderDealers();
