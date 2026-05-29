/**
 * ALVRYN — destinations.js
 * Complete destinations database for flights, buses, trains, hotels
 * Includes major + local Indian cities + international destinations
 */

// ── FLIGHT DESTINATIONS ──────────────────────────────────────────────────────
export const FLIGHT_CITIES = [
  // ── TOP INDIA ──
  { city: "Bangalore", code: "BLR", airport: "Kempegowda International", country: "India", top: true },
  { city: "Delhi", code: "DEL", airport: "Indira Gandhi International", country: "India", top: true },
  { city: "Mumbai", code: "BOM", airport: "Chhatrapati Shivaji International", country: "India", top: true },
  { city: "Chennai", code: "MAA", airport: "Chennai International", country: "India", top: true },
  { city: "Hyderabad", code: "HYD", airport: "Rajiv Gandhi International", country: "India", top: true },
  { city: "Kolkata", code: "CCU", airport: "Netaji Subhas Chandra Bose Intl", country: "India", top: true },
  { city: "Goa", code: "GOI", airport: "Dabolim / Mopa Airport", country: "India", top: true },
  { city: "Pune", code: "PNQ", airport: "Pune International", country: "India", top: true },
  { city: "Kochi", code: "COK", airport: "Cochin International", country: "India", top: true },
  { city: "Ahmedabad", code: "AMD", airport: "Sardar Vallabhbhai Patel Intl", country: "India", top: true },
  { city: "Jaipur", code: "JAI", airport: "Jaipur International", country: "India", top: true },
  { city: "Lucknow", code: "LKO", airport: "Chaudhary Charan Singh Intl", country: "India", top: true },
  // ── SOUTH INDIA ──
  { city: "Coimbatore", code: "CBE", airport: "Coimbatore International", country: "India" },
  { city: "Madurai", code: "IXM", airport: "Madurai Airport", country: "India" },
  { city: "Trichy", code: "TRZ", airport: "Tiruchirappalli International", country: "India" },
  { city: "Trivandrum", code: "TRV", airport: "Trivandrum International", country: "India" },
  { city: "Kozhikode", code: "CCJ", airport: "Calicut International", country: "India" },
  { city: "Mangalore", code: "IXE", airport: "Mangalore International", country: "India" },
  { city: "Mysore", code: "MYQ", airport: "Mysore Airport", country: "India" },
  { city: "Tirupati", code: "TIR", airport: "Tirupati Airport", country: "India" },
  { city: "Vijayawada", code: "VGA", airport: "Vijayawada International", country: "India" },
  { city: "Visakhapatnam", code: "VTZ", airport: "Visakhapatnam Airport", country: "India" },
  { city: "Hubli", code: "HBX", airport: "Hubli Airport", country: "India" },
  { city: "Belgaum", code: "IXG", airport: "Belgaum Airport", country: "India" },
  { city: "Salem", code: "SXV", airport: "Salem Airport", country: "India" },
  { city: "Pondicherry", code: "PNY", airport: "Pondicherry Airport", country: "India" },
  // ── NORTH INDIA ──
  { city: "Varanasi", code: "VNS", airport: "Lal Bahadur Shastri Intl", country: "India" },
  { city: "Patna", code: "PAT", airport: "Jay Prakash Narayan Intl", country: "India" },
  { city: "Chandigarh", code: "IXC", airport: "Chandigarh International", country: "India" },
  { city: "Amritsar", code: "ATQ", airport: "Sri Guru Ram Dass Jee Intl", country: "India" },
  { city: "Agra", code: "AGR", airport: "Agra Airport", country: "India" },
  { city: "Dehradun", code: "DED", airport: "Jolly Grant Airport", country: "India" },
  { city: "Srinagar", code: "SXR", airport: "Sheikh ul Alam International", country: "India" },
  { city: "Jammu", code: "IXJ", airport: "Jammu Airport", country: "India" },
  { city: "Leh", code: "IXL", airport: "Kushok Bakula Rimpochee Airport", country: "India" },
  { city: "Shimla", code: "SLV", airport: "Shimla Airport", country: "India" },
  { city: "Dharamshala", code: "DHM", airport: "Gaggal Airport", country: "India" },
  { city: "Jodhpur", code: "JDH", airport: "Jodhpur Airport", country: "India" },
  { city: "Udaipur", code: "UDR", airport: "Maharana Pratap Airport", country: "India" },
  { city: "Jaisalmer", code: "JSA", airport: "Jaisalmer Airport", country: "India" },
  // ── EAST INDIA ──
  { city: "Bhubaneswar", code: "BBI", airport: "Biju Patnaik International", country: "India" },
  { city: "Ranchi", code: "IXR", airport: "Birsa Munda Airport", country: "India" },
  { city: "Guwahati", code: "GAU", airport: "Lokpriya Gopinath Bordoloi Intl", country: "India" },
  { city: "Imphal", code: "IMF", airport: "Imphal Airport", country: "India" },
  { city: "Agartala", code: "IXA", airport: "Maharaja Bir Bikram Airport", country: "India" },
  { city: "Dibrugarh", code: "DIB", airport: "Dibrugarh Airport", country: "India" },
  { city: "Jorhat", code: "JRH", airport: "Rowriah Airport", country: "India" },
  { city: "Silchar", code: "IXS", airport: "Silchar Airport", country: "India" },
  // ── WEST INDIA ──
  { city: "Nagpur", code: "NAG", airport: "Dr Babasaheb Ambedkar Intl", country: "India" },
  { city: "Aurangabad", code: "IXU", airport: "Aurangabad Airport", country: "India" },
  { city: "Surat", code: "STV", airport: "Surat Airport", country: "India" },
  { city: "Vadodara", code: "BDQ", airport: "Vadodara Airport", country: "India" },
  { city: "Rajkot", code: "RAJ", airport: "Rajkot Airport", country: "India" },
  { city: "Indore", code: "IDR", airport: "Devi Ahilyabai Holkar Airport", country: "India" },
  { city: "Bhopal", code: "BHO", airport: "Raja Bhoj Airport", country: "India" },
  { city: "Raipur", code: "RPR", airport: "Swami Vivekananda Airport", country: "India" },
  { city: "Port Blair", code: "IXZ", airport: "Veer Savarkar International", country: "India" },
  // ── INTERNATIONAL TOP ──
  { city: "Dubai", code: "DXB", airport: "Dubai International", country: "UAE", top: true },
  { city: "Singapore", code: "SIN", airport: "Changi Airport", country: "Singapore", top: true },
  { city: "Bangkok", code: "BKK", airport: "Suvarnabhumi Airport", country: "Thailand", top: true },
  { city: "London", code: "LHR", airport: "Heathrow Airport", country: "UK", top: true },
  { city: "New York", code: "JFK", airport: "John F Kennedy International", country: "USA", top: true },
  { city: "Kuala Lumpur", code: "KUL", airport: "KL International Airport", country: "Malaysia", top: true },
  { city: "Colombo", code: "CMB", airport: "Bandaranaike International", country: "Sri Lanka" },
  { city: "Kathmandu", code: "KTM", airport: "Tribhuvan International", country: "Nepal" },
  { city: "Paris", code: "CDG", airport: "Charles de Gaulle Airport", country: "France" },
  { city: "Tokyo", code: "NRT", airport: "Narita International", country: "Japan" },
  { city: "Sydney", code: "SYD", airport: "Kingsford Smith Airport", country: "Australia" },
  { city: "Doha", code: "DOH", airport: "Hamad International", country: "Qatar" },
  { city: "Abu Dhabi", code: "AUH", airport: "Zayed International", country: "UAE" },
  { city: "Male", code: "MLE", airport: "Velana International", country: "Maldives" },
  { city: "Bali", code: "DPS", airport: "Ngurah Rai International", country: "Indonesia" },
  { city: "Phuket", code: "HKT", airport: "Phuket International", country: "Thailand" },
  { city: "Istanbul", code: "IST", airport: "Istanbul Airport", country: "Turkey" },
  { city: "Frankfurt", code: "FRA", airport: "Frankfurt Airport", country: "Germany" },
  { city: "Amsterdam", code: "AMS", airport: "Amsterdam Schiphol", country: "Netherlands" },
  { city: "Toronto", code: "YYZ", airport: "Pearson International", country: "Canada" },
  { city: "Los Angeles", code: "LAX", airport: "Los Angeles International", country: "USA" },
  { city: "Hong Kong", code: "HKG", airport: "Hong Kong International", country: "Hong Kong" },
  { city: "Seoul", code: "ICN", airport: "Incheon International", country: "South Korea" },
  { city: "Osaka", code: "KIX", airport: "Kansai International", country: "Japan" },
  { city: "Melbourne", code: "MEL", airport: "Melbourne Airport", country: "Australia" },
  { city: "Muscat", code: "MCT", airport: "Muscat International", country: "Oman" },
  { city: "Riyadh", code: "RUH", airport: "King Khalid International", country: "Saudi Arabia" },
  { city: "Jeddah", code: "JED", airport: "King Abdulaziz International", country: "Saudi Arabia" },
  { city: "Rome", code: "FCO", airport: "Fiumicino Airport", country: "Italy" },
  { city: "Barcelona", code: "BCN", airport: "Barcelona El Prat", country: "Spain" },
  { city: "Zurich", code: "ZRH", airport: "Zurich Airport", country: "Switzerland" },
  { city: "Vienna", code: "VIE", airport: "Vienna International", country: "Austria" },
  { city: "Nairobi", code: "NBO", airport: "Jomo Kenyatta International", country: "Kenya" },
  { city: "Johannesburg", code: "JNB", airport: "OR Tambo International", country: "South Africa" },
  { city: "Dhaka", code: "DAC", airport: "Hazrat Shahjalal International", country: "Bangladesh" },
  { city: "Sharjah", code: "SHJ", airport: "Sharjah International", country: "UAE" },
  { city: "Taipei", code: "TPE", airport: "Taoyuan International", country: "Taiwan" },
  { city: "Manila", code: "MNL", airport: "Ninoy Aquino International", country: "Philippines" },
  { city: "Jakarta", code: "CGK", airport: "Soekarno-Hatta International", country: "Indonesia" },
  { city: "Auckland", code: "AKL", airport: "Auckland Airport", country: "New Zealand" },
  { city: "Vancouver", code: "YVR", airport: "Vancouver International", country: "Canada" },
  { city: "Chicago", code: "ORD", airport: "O'Hare International", country: "USA" },
  { city: "San Francisco", code: "SFO", airport: "San Francisco International", country: "USA" },
  { city: "Beijing", code: "PEK", airport: "Capital International", country: "China" },
  { city: "Shanghai", code: "PVG", airport: "Pudong International", country: "China" },
  { city: "Cairo", code: "CAI", airport: "Cairo International", country: "Egypt" },
];

// ── BUS DESTINATIONS ─────────────────────────────────────────────────────────
// All major RedBus cities + local towns
export const BUS_CITIES = [
  // Karnataka
  "Bangalore", "Mysore", "Mangalore", "Hubli", "Dharwad", "Belgaum", "Bidar",
  "Gulbarga", "Bellary", "Shimoga", "Tumkur", "Hassan", "Chikmagalur", "Udupi",
  "Davangere", "Raichur", "Bijapur", "Hospet", "Hampi", "Coorg", "Madikeri",
  "Kodagu", "Chamarajanagar", "Mandya", "Ramanagara", "Kolar", "Chintamani",
  "Bagalkot", "Gadag", "Koppal", "Haveri", "Sirsi", "Karwar", "Ankola",
  // Tamil Nadu
  "Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli",
  "Vellore", "Erode", "Thanjavur", "Tanjore", "Pondicherry", "Ooty",
  "Kodaikanal", "Kumbakonam", "Nagercoil", "Kanyakumari", "Dindigul",
  "Rajapalayam", "Virudhunagar", "Sivakasi", "Theni", "Pollachi", "Palani",
  "Hosur", "Krishnagiri", "Dharmapuri", "Namakkal", "Karur", "Perambalur",
  "Ariyalur", "Cuddalore", "Villupuram", "Pudukottai", "Ramnad",
  "Marthandam", "Tirupur", "Tiruvannamalai", "Chidambaram",
  // Kerala
  "Kochi", "Trivandrum", "Kozhikode", "Thrissur", "Kollam", "Varkala",
  "Alleppey", "Kottayam", "Munnar", "Wayanad", "Kannur", "Kasaragod",
  "Malappuram", "Palakkad", "Manjeri", "Tirur", "Thalassery", "Vadakara",
  "Pathanamthitta", "Idukki", "Ernakulam", "Alappuzha", "Calicut",
  // Andhra Pradesh / Telangana
  "Hyderabad", "Visakhapatnam", "Vijayawada", "Tirupati", "Warangal",
  "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Kakinada", "Eluru",
  "Ongole", "Nandyal", "Anantapur", "Kadapa", "Chittoor", "Srikakulam",
  "Vizianagaram", "Bhimavaram", "Tenali", "Machilipatnam",
  "Karimnagar", "Nizamabad", "Khammam", "Mahbubnagar", "Adilabad",
  // Maharashtra
  "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur",
  "Solapur", "Sangli", "Satara", "Ratnagiri", "Sindhudurg", "Thane",
  "Navi Mumbai", "Amravati", "Akola", "Latur", "Osmanabad", "Nanded",
  "Jalgaon", "Dhule", "Ahmednagar", "Buldhana", "Yavatmal", "Beed",
  // Goa
  "Goa", "Panaji", "Mapusa", "Margao", "Vasco da Gama", "Ponda",
  // Delhi NCR
  "Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad",
  // Rajasthan
  "Jaipur", "Jodhpur", "Udaipur", "Ajmer", "Pushkar", "Bikaner",
  "Kota", "Alwar", "Bharatpur", "Jaisalmer", "Chittorgarh", "Mount Abu",
  // Uttar Pradesh
  "Lucknow", "Agra", "Varanasi", "Allahabad", "Prayagraj", "Kanpur",
  "Gorakhpur", "Mathura", "Vrindavan", "Rishikesh", "Haridwar", "Meerut",
  "Bareilly", "Moradabad", "Aligarh", "Jhansi", "Ayodhya",
  // Himachal / Uttarakhand
  "Shimla", "Manali", "Dharamshala", "McLeod Ganj", "Kasol", "Spiti",
  "Dehradun", "Mussoorie", "Nainital", "Haridwar", "Rishikesh",
  // Punjab / Haryana
  "Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala",
  // Gujarat
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
  "Gandhinagar", "Anand", "Navsari", "Valsad", "Mehsana",
  // Madhya Pradesh
  "Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain", "Sagar",
  "Ratlam", "Dewas", "Satna", "Rewa",
  // Odisha
  "Bhubaneswar", "Puri", "Cuttack", "Rourkela", "Berhampur",
  // West Bengal
  "Kolkata", "Darjeeling", "Siliguri", "Durgapur", "Asansol",
  // Bihar / Jharkhand
  "Patna", "Gaya", "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro",
  // Northeast
  "Guwahati", "Shillong", "Agartala", "Imphal", "Kohima",
  // Andaman
  "Port Blair",
];

// ── TRAIN DESTINATIONS ───────────────────────────────────────────────────────
// All major IRCTC station cities
export const TRAIN_CITIES = [
  // South India
  { city: "Bangalore", code: "SBC" },
  { city: "Chennai", code: "MAS" },
  { city: "Hyderabad", code: "SC" },
  { city: "Kochi", code: "ERS" },
  { city: "Trivandrum", code: "TVC" },
  { city: "Coimbatore", code: "CBE" },
  { city: "Madurai", code: "MDU" },
  { city: "Mysore", code: "MYS" },
  { city: "Mangalore", code: "MAQ" },
  { city: "Visakhapatnam", code: "VSKP" },
  { city: "Vijayawada", code: "BZA" },
  { city: "Tirupati", code: "TPTY" },
  { city: "Kozhikode", code: "CLT" },
  { city: "Thrissur", code: "TCR" },
  { city: "Kollam", code: "QLN" },
  { city: "Nagercoil", code: "NCJ" },
  { city: "Marthandam", code: "MVK" },
  { city: "Kanyakumari", code: "CAPE" },
  { city: "Tirunelveli", code: "TEN" },
  { city: "Salem", code: "SA" },
  { city: "Erode", code: "ED" },
  { city: "Trichy", code: "TPJ" },
  { city: "Thanjavur", code: "TJ" },
  { city: "Hosur", code: "HOS" },
  { city: "Vellore", code: "KPD" },
  { city: "Pondicherry", code: "PDY" },
  { city: "Warangal", code: "WL" },
  { city: "Guntur", code: "GNT" },
  { city: "Nellore", code: "NLR" },
  { city: "Kurnool", code: "KRNT" },
  { city: "Rajahmundry", code: "RJY" },
  { city: "Hubli", code: "UBL" },
  { city: "Belgaum", code: "BGM" },
  { city: "Davangere", code: "DVG" },
  { city: "Hassan", code: "HAS" },
  { city: "Udupi", code: "UD" },
  // North India
  { city: "Delhi", code: "NDLS" },
  { city: "Mumbai", code: "CSTM" },
  { city: "Kolkata", code: "HWH" },
  { city: "Ahmedabad", code: "ADI" },
  { city: "Pune", code: "PUNE" },
  { city: "Jaipur", code: "JP" },
  { city: "Lucknow", code: "LKO" },
  { city: "Varanasi", code: "BSB" },
  { city: "Agra", code: "AGC" },
  { city: "Patna", code: "PNBE" },
  { city: "Bhopal", code: "BPL" },
  { city: "Indore", code: "INDB" },
  { city: "Nagpur", code: "NGP" },
  { city: "Surat", code: "ST" },
  { city: "Chandigarh", code: "CDG" },
  { city: "Amritsar", code: "ASR" },
  { city: "Jodhpur", code: "JU" },
  { city: "Udaipur", code: "UDZ" },
  { city: "Ajmer", code: "AII" },
  { city: "Gorakhpur", code: "GKP" },
  { city: "Allahabad", code: "ALD" },
  { city: "Kanpur", code: "CNB" },
  { city: "Mathura", code: "MTJ" },
  { city: "Dehradun", code: "DDN" },
  { city: "Haridwar", code: "HW" },
  { city: "Rishikesh", code: "RKSH" },
  { city: "Guwahati", code: "GHY" },
  { city: "Bhubaneswar", code: "BBS" },
  { city: "Ranchi", code: "RNC" },
  { city: "Jamshedpur", code: "TATA" },
  { city: "Puri", code: "PURI" },
  { city: "Siliguri", code: "NJP" },
  { city: "Darjeeling", code: "DHJ" },
  { city: "Goa", code: "MAO" },
  { city: "Aurangabad", code: "AWB" },
  { city: "Nashik", code: "NK" },
  { city: "Kolhapur", code: "KOP" },
  { city: "Solapur", code: "SUR" },
  { city: "Vadodara", code: "BRC" },
  { city: "Rajkot", code: "RJT" },
  { city: "Srinagar", code: "SVDK" },
  { city: "Jammu", code: "JAT" },
];

// ── HOTEL CITIES ─────────────────────────────────────────────────────────────
export const HOTEL_CITIES = [
  // India - all major + tourist + hill stations
  "Goa", "Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata",
  "Jaipur", "Kochi", "Agra", "Varanasi", "Udaipur", "Manali", "Shimla",
  "Ooty", "Kodaikanal", "Munnar", "Varkala", "Alleppey", "Coorg",
  "Pondicherry", "Andaman", "Port Blair", "Leh", "Ladakh", "Dharamshala",
  "McLeod Ganj", "Rishikesh", "Haridwar", "Mussoorie", "Nainital",
  "Pushkar", "Jodhpur", "Jaisalmer", "Bikaner", "Mount Abu",
  "Mysore", "Hampi", "Coimbatore", "Trichy", "Madurai", "Rameshwaram",
  "Tirupati", "Pune", "Aurangabad", "Nashik", "Lonavala", "Mahabaleshwar",
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar",
  "Chandigarh", "Amritsar", "Ludhiana", "Gurugram", "Noida",
  "Lucknow", "Kanpur", "Allahabad", "Mathura", "Vrindavan", "Ayodhya",
  "Patna", "Gaya", "Bodh Gaya", "Ranchi", "Bhubaneswar", "Puri",
  "Darjeeling", "Gangtok", "Shillong", "Guwahati", "Siliguri",
  "Thrissur", "Kozhikode", "Kollam", "Kottayam", "Waynad", "Periyar",
  "Nagercoil", "Kanyakumari", "Tirunelveli", "Madurai",
  // International
  "Dubai", "Singapore", "Bangkok", "London", "Paris", "Tokyo", "Bali",
  "Maldives", "Male", "Phuket", "Kuala Lumpur", "Istanbul", "Rome",
  "Barcelona", "Amsterdam", "Zurich", "Vienna", "Prague", "Budapest",
  "Sydney", "Melbourne", "Auckland", "Toronto", "Vancouver", "New York",
  "Los Angeles", "San Francisco", "Chicago", "Las Vegas",
  "Colombo", "Kathmandu", "Dhaka", "Doha", "Abu Dhabi", "Muscat",
  "Riyadh", "Jeddah", "Nairobi", "Cairo", "Seoul", "Osaka", "Hong Kong",
  "Taipei", "Manila", "Jakarta", "Hanoi", "Ho Chi Minh City",
];

// ── LINK BUILDERS ─────────────────────────────────────────────────────────────

/**
 * Build Aviasales affiliate flight link
 * @param {string} fromCode - IATA code
 * @param {string} toCode - IATA code
 * @param {string} date - DD-MM-YYYY or Date object
 * @param {number} passengers
 * @param {string} tripType - 'one_way' | 'round_trip'
 * @param {string} cabinClass - 'economy' | 'business' | 'first'
 */
export function buildFlightLink({ fromCode, toCode, date, returnDate, passengers = 1, cabinClass = "economy" }) {
  const INDIA_CODES = new Set([
    "BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
    "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV",
    "VTZ","VGA","IXR","BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ",
    "NAG","IDR","RPR","DED","SLV","ATQ","UDR","JDH","AGR","STV","CCJ","TRZ",
    "HYD","SXV","PNY","DIB","JRH","IXS","IMF","IXA","IXU","BDQ","RAJ","DHM","JSA",
  ]);
  const isIndia = INDIA_CODES.has(fromCode) && INDIA_CODES.has(toCode);
  const base = isIndia
    ? "https://www.aviasales.in"
    : "https://www.aviasales.com";

  // Format date as DDMM for Aviasales
  let ddmm = "";
  if (date) {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isNaN(d)) {
      ddmm = String(d.getDate()).padStart(2, "0") + String(d.getMonth() + 1).padStart(2, "0");
    }
  }

  let url = `${base}/search/${fromCode}${ddmm}${toCode}${passengers}`;
  if (returnDate) {
    const r = typeof returnDate === "string" ? new Date(returnDate) : returnDate;
    if (!isNaN(r)) {
      const rddmm = String(r.getDate()).padStart(2, "0") + String(r.getMonth() + 1).padStart(2, "0");
      url += rddmm;
    }
  }
  url += "?marker=714667&sub_id=alvryn_search";
  if (cabinClass === "business") url += "&class=business";
  if (cabinClass === "first") url += "&class=first";
  return url;
}

/**
 * Build RedBus affiliate link
 */
export function buildBusLink({ from, to, date }) {
  const fromSlug = (from || "").toLowerCase().replace(/\s+/g, "-");
  const toSlug = (to || "").toLowerCase().replace(/\s+/g, "-");
  let url = `https://www.redbus.in/bus-tickets/${fromSlug}-to-${toSlug}`;
  if (date) {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      url += `?doj=${dd}-${mm}-${yyyy}`;
    }
  }
  return url;
}

/**
 * Build IRCTC train link with pre-filled route + date
 */
export function buildTrainLink({ fromCode, toCode, date }) {
  let url = `https://www.irctc.co.in/nget/train-search?fromStation=${fromCode}&toStation=${toCode}&isCallFromDpDown=true&quota=GN&class=SL`;
  if (date) {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      url += `&journeyDate=${dd}-${mm}-${yyyy}`;
    }
  }
  return url;
}

/**
 * Build Booking.com hotel link with pre-filled city + dates
 */
export function buildHotelLink({ city, checkIn, checkOut, guests = 1, rooms = 1 }) {
  let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&group_adults=${guests}&no_rooms=${rooms}`;
  if (checkIn) {
    const ci = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
    if (!isNaN(ci)) {
      url += `&checkin=${ci.getFullYear()}-${String(ci.getMonth()+1).padStart(2,"0")}-${String(ci.getDate()).padStart(2,"0")}`;
    }
  }
  if (checkOut) {
    const co = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
    if (!isNaN(co)) {
      url += `&checkout=${co.getFullYear()}-${String(co.getMonth()+1).padStart(2,"0")}-${String(co.getDate()).padStart(2,"0")}`;
    }
  }
  return url;
}

// ── SEARCH HELPERS ────────────────────────────────────────────────────────────

/**
 * Search flight cities by name, code, or country
 */
export function searchFlightCities(query) {
  if (!query || query.length < 1) return FLIGHT_CITIES.filter(c => c.top);
  const q = query.toLowerCase();
  return FLIGHT_CITIES.filter(c =>
    c.city.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) ||
    c.airport.toLowerCase().includes(q)
  ).slice(0, 10);
}

/**
 * Search bus cities
 */
export function searchBusCities(query) {
  if (!query || query.length < 1) return BUS_CITIES.slice(0, 20);
  const q = query.toLowerCase();
  return BUS_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 10);
}

/**
 * Search train cities
 */
export function searchTrainCities(query) {
  if (!query || query.length < 1) return TRAIN_CITIES.slice(0, 20);
  const q = query.toLowerCase();
  return TRAIN_CITIES.filter(c =>
    c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  ).slice(0, 10);
}

/**
 * Search hotel cities
 */
export function searchHotelCities(query) {
  if (!query || query.length < 1) return HOTEL_CITIES.slice(0, 20);
  const q = query.toLowerCase();
  return HOTEL_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 10);
}