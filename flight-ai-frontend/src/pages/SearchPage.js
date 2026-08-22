/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_DARK = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

const INDIA_IATA = new Set([
  "BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI","LKO",
  "VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV","VTZ","IXR",
  "BHO","SXR","IXJ","NAG","IDR","IXL","IXZ","ATQ","UDR","JDH","AGR","STV",
  "HBX","IXG","TIR","VGA","CCJ","TRZ","DED","SLV","RPR",
]);

const FLIGHT_CITIES = [
  {code:"BLR",name:"Bangalore",full:"Kempegowda International",country:"India",top:true},
  {code:"BOM",name:"Mumbai",full:"Chhatrapati Shivaji Intl",country:"India",top:true},
  {code:"DEL",name:"Delhi",full:"Indira Gandhi International",country:"India",top:true},
  {code:"MAA",name:"Chennai",full:"Chennai International",country:"India",top:true},
  {code:"HYD",name:"Hyderabad",full:"Rajiv Gandhi International",country:"India",top:true},
  {code:"CCU",name:"Kolkata",full:"Netaji Subhas Chandra Bose Intl",country:"India",top:true},
  {code:"GOI",name:"Goa",full:"Dabolim / Mopa Airport",country:"India",top:true},
  {code:"PNQ",name:"Pune",full:"Pune Airport",country:"India",top:true},
  {code:"COK",name:"Kochi",full:"Cochin International",country:"India",top:true},
  {code:"AMD",name:"Ahmedabad",full:"Sardar Vallabhbhai Patel Intl",country:"India",top:true},
  {code:"JAI",name:"Jaipur",full:"Jaipur International",country:"India",top:true},
  {code:"LKO",name:"Lucknow",full:"Chaudhary Charan Singh Intl",country:"India"},
  {code:"VNS",name:"Varanasi",full:"Lal Bahadur Shastri Airport",country:"India"},
  {code:"PAT",name:"Patna",full:"Jay Prakash Narayan Airport",country:"India"},
  {code:"IXC",name:"Chandigarh",full:"Chandigarh Airport",country:"India"},
  {code:"GAU",name:"Guwahati",full:"Lokpriya Gopinath Bordoloi Intl",country:"India"},
  {code:"BBI",name:"Bhubaneswar",full:"Biju Patnaik International",country:"India"},
  {code:"CBE",name:"Coimbatore",full:"Coimbatore International",country:"India"},
  {code:"IXM",name:"Madurai",full:"Madurai Airport",country:"India"},
  {code:"IXE",name:"Mangalore",full:"Mangalore International",country:"India"},
  {code:"MYQ",name:"Mysore",full:"Mysore Airport",country:"India"},
  {code:"TRV",name:"Trivandrum",full:"Trivandrum International",country:"India"},
  {code:"VTZ",name:"Visakhapatnam",full:"Visakhapatnam Airport",country:"India"},
  {code:"IXR",name:"Ranchi",full:"Birsa Munda Airport",country:"India"},
  {code:"BHO",name:"Bhopal",full:"Raja Bhoj Airport",country:"India"},
  {code:"SXR",name:"Srinagar",full:"Sheikh ul-Alam Airport",country:"India"},
  {code:"IXJ",name:"Jammu",full:"Jammu Airport",country:"India"},
  {code:"NAG",name:"Nagpur",full:"Dr. Babasaheb Ambedkar Intl",country:"India"},
  {code:"IDR",name:"Indore",full:"Devi Ahilyabai Holkar Airport",country:"India"},
  {code:"IXL",name:"Leh",full:"Kushok Bakula Rimpochee Airport",country:"India"},
  {code:"IXZ",name:"Port Blair",full:"Veer Savarkar International",country:"India"},
  {code:"ATQ",name:"Amritsar",full:"Sri Guru Ram Dass Jee Intl",country:"India"},
  {code:"UDR",name:"Udaipur",full:"Maharana Pratap Airport",country:"India"},
  {code:"JDH",name:"Jodhpur",full:"Jodhpur Airport",country:"India"},
  {code:"AGR",name:"Agra",full:"Agra Airport",country:"India"},
  {code:"HBX",name:"Hubli",full:"Hubballi Airport",country:"India"},
  {code:"IXG",name:"Belgaum",full:"Belagavi Airport",country:"India"},
  {code:"TIR",name:"Tirupati",full:"Tirupati Airport",country:"India"},
  {code:"VGA",name:"Vijayawada",full:"Vijayawada International",country:"India"},
  {code:"CCJ",name:"Kozhikode",full:"Calicut International",country:"India"},
  {code:"TRZ",name:"Trichy",full:"Tiruchirappalli International",country:"India"},
  {code:"DED",name:"Dehradun",full:"Jolly Grant Airport",country:"India"},
  {code:"STV",name:"Surat",full:"Surat Airport",country:"India"},
  {code:"DXB",name:"Dubai",full:"Dubai International",country:"UAE",top:true},
  {code:"SIN",name:"Singapore",full:"Changi Airport",country:"Singapore",top:true},
  {code:"BKK",name:"Bangkok",full:"Suvarnabhumi Airport",country:"Thailand",top:true},
  {code:"LHR",name:"London",full:"Heathrow Airport",country:"UK",top:true},
  {code:"JFK",name:"New York",full:"JFK International",country:"USA",top:true},
  {code:"KUL",name:"Kuala Lumpur",full:"KLIA Airport",country:"Malaysia",top:true},
  {code:"CMB",name:"Colombo",full:"Bandaranaike International",country:"Sri Lanka"},
  {code:"CDG",name:"Paris",full:"Charles de Gaulle",country:"France"},
  {code:"NRT",name:"Tokyo",full:"Narita International",country:"Japan"},
  {code:"SYD",name:"Sydney",full:"Kingsford Smith",country:"Australia"},
  {code:"FRA",name:"Frankfurt",full:"Frankfurt Airport",country:"Germany"},
  {code:"AMS",name:"Amsterdam",full:"Schiphol Airport",country:"Netherlands"},
  {code:"YYZ",name:"Toronto",full:"Pearson International",country:"Canada"},
  {code:"LAX",name:"Los Angeles",full:"LAX Airport",country:"USA"},
  {code:"HKG",name:"Hong Kong",full:"Hong Kong International",country:"Hong Kong"},
  {code:"DOH",name:"Doha",full:"Hamad International",country:"Qatar"},
  {code:"AUH",name:"Abu Dhabi",full:"Zayed International",country:"UAE"},
  {code:"IST",name:"Istanbul",full:"Istanbul Airport",country:"Turkey"},
  {code:"DPS",name:"Bali",full:"Ngurah Rai International",country:"Indonesia"},
  {code:"KTM",name:"Kathmandu",full:"Tribhuvan International",country:"Nepal"},
  {code:"MLE",name:"Maldives",full:"Velana International",country:"Maldives"},
  {code:"HKT",name:"Phuket",full:"Phuket International",country:"Thailand"},
  {code:"ICN",name:"Seoul",full:"Incheon International",country:"South Korea"},
  {code:"MEL",name:"Melbourne",full:"Melbourne Airport",country:"Australia"},
  {code:"MCT",name:"Muscat",full:"Muscat International",country:"Oman"},
];

const BUS_CITIES = [
  "Bangalore","Mysore","Mangalore","Hubli","Dharwad","Belgaum","Shimoga","Tumkur",
  "Hassan","Chikmagalur","Udupi","Davangere","Raichur","Hospet","Hampi","Madikeri",
  "Coorg","Chamarajanagar","Mandya","Ramanagara","Kolar","Chintamani","Gadag",
  "Haveri","Sirsi","Karwar","Hosur","Yelahanka","Whitefield","Koramangala",
  "Chennai","Coimbatore","Madurai","Trichy","Salem","Tirunelveli","Vellore","Erode",
  "Thanjavur","Pondicherry","Ooty","Kodaikanal","Kumbakonam","Nagercoil","Kanyakumari",
  "Dindigul","Pollachi","Krishnagiri","Dharmapuri","Namakkal","Karur","Tirupur",
  "Marthandam","Cuddalore","Villupuram","Tenkasi","Ambur","Ranipet","Sriperumbudur",
  "Kochi","Trivandrum","Kozhikode","Thrissur","Kollam","Varkala","Alleppey","Kottayam",
  "Munnar","Wayanad","Kannur","Kasaragod","Malappuram","Palakkad","Thalassery",
  "Calicut","Changanacherry","Thodupuzha","Angamaly","Perumbavoor",
  "Hyderabad","Visakhapatnam","Vijayawada","Tirupati","Warangal","Guntur","Nellore",
  "Kurnool","Rajahmundry","Kakinada","Eluru","Ongole","Nandyal","Anantapur","Kadapa",
  "Chittoor","Karimnagar","Nizamabad","Khammam","Mahbubnagar","Suryapet",
  "Mumbai","Pune","Nagpur","Nashik","Aurangabad","Kolhapur","Solapur","Sangli",
  "Satara","Ratnagiri","Thane","Navi Mumbai","Amravati","Akola","Latur",
  "Nanded","Jalgaon","Dhule","Lonavala","Mahabaleshwar","Alibaug",
  "Goa","Panaji","Mapusa","Margao","Vasco","Ponda","Calangute","Anjuna",
  "Delhi","Gurgaon","Noida","Faridabad","Ghaziabad",
  "Jaipur","Jodhpur","Udaipur","Ajmer","Pushkar","Bikaner","Kota","Alwar",
  "Bharatpur","Jaisalmer","Chittorgarh","Mount Abu","Sikar",
  "Lucknow","Agra","Varanasi","Allahabad","Prayagraj","Kanpur","Gorakhpur",
  "Mathura","Vrindavan","Meerut","Bareilly","Jhansi","Ayodhya",
  "Haridwar","Rishikesh","Dehradun","Mussoorie","Nainital",
  "Shimla","Manali","Dharamshala","McLeod Ganj","Kasol","Kullu","Mandi",
  "Chandigarh","Amritsar","Ludhiana","Jalandhar","Patiala",
  "Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar",
  "Indore","Bhopal","Gwalior","Jabalpur","Ujjain","Sagar","Ratlam",
  "Bhubaneswar","Puri","Cuttack","Rourkela","Berhampur",
  "Kolkata","Darjeeling","Siliguri","Durgapur","Asansol",
  "Patna","Gaya","Ranchi","Jamshedpur","Dhanbad",
  "Guwahati","Shillong","Agartala","Imphal",
];

const TRAIN_CITIES = [
  {city:"Bangalore",code:"SBC"},{city:"Yeshwanthpur",code:"YPR"},{city:"Hosur",code:"HOS"},
  {city:"Chennai Central",code:"MAS"},{city:"Chennai Egmore",code:"MS"},
  {city:"Hyderabad Deccan",code:"HYB"},{city:"Secunderabad",code:"SC"},
  {city:"Kochi Ernakulam",code:"ERS"},{city:"Trivandrum",code:"TVC"},
  {city:"Coimbatore",code:"CBE"},{city:"Madurai",code:"MDU"},{city:"Mysore",code:"MYS"},
  {city:"Mangalore",code:"MAQ"},{city:"Visakhapatnam",code:"VSKP"},
  {city:"Vijayawada",code:"BZA"},{city:"Tirupati",code:"TPTY"},
  {city:"Kozhikode",code:"CLT"},{city:"Thrissur",code:"TCR"},{city:"Kollam",code:"QLN"},
  {city:"Nagercoil",code:"NCJ"},{city:"Kanyakumari",code:"CAPE"},
  {city:"Tirunelveli",code:"TEN"},{city:"Salem",code:"SA"},{city:"Erode",code:"ED"},
  {city:"Trichy",code:"TPJ"},{city:"Thanjavur",code:"TJ"},{city:"Vellore",code:"KPD"},
  {city:"Pondicherry",code:"PDY"},{city:"Warangal",code:"WL"},{city:"Guntur",code:"GNT"},
  {city:"Nellore",code:"NLR"},{city:"Kurnool",code:"KRNT"},{city:"Rajahmundry",code:"RJY"},
  {city:"Hubli",code:"UBL"},{city:"Belgaum",code:"BGM"},{city:"Marthandam",code:"MVK"},
  {city:"Delhi New Delhi",code:"NDLS"},{city:"Delhi Nizamuddin",code:"NZM"},
  {city:"Mumbai CSMT",code:"CSTM"},{city:"Mumbai Central",code:"BCT"},
  {city:"Kolkata Howrah",code:"HWH"},{city:"Kolkata Sealdah",code:"SDAH"},
  {city:"Ahmedabad",code:"ADI"},{city:"Pune",code:"PUNE"},{city:"Jaipur",code:"JP"},
  {city:"Lucknow",code:"LKO"},{city:"Varanasi",code:"BSB"},{city:"Patna",code:"PNBE"},
  {city:"Bhopal",code:"BPL"},{city:"Nagpur",code:"NGP"},{city:"Chandigarh",code:"CDG"},
  {city:"Guwahati",code:"GHY"},{city:"Amritsar",code:"ASR"},{city:"Indore",code:"INDB"},
  {city:"Agra Cantt",code:"AGC"},{city:"Mathura",code:"MTJ"},{city:"Prayagraj",code:"ALD"},
  {city:"Gorakhpur",code:"GKP"},{city:"Dehradun",code:"DDN"},{city:"Haridwar",code:"HW"},
  {city:"Ranchi",code:"RNC"},{city:"Bhubaneswar",code:"BBS"},{city:"Puri",code:"PURI"},
  {city:"Goa Madgaon",code:"MAO"},{city:"Nashik",code:"NK"},{city:"Surat",code:"ST"},
  {city:"Vadodara",code:"BRC"},{city:"Jodhpur",code:"JU"},{city:"Udaipur",code:"UDZ"},
  {city:"Kanpur",code:"CNB"},{city:"Kolhapur",code:"KOP"},{city:"Solapur",code:"SUR"},
  {city:"Jamshedpur",code:"TATA"},{city:"Dhanbad",code:"DHN"},
  {city:"Darjeeling",code:"DJ"},{city:"Siliguri",code:"SGUJ"},
];

const HOTEL_CITIES = [
  "Goa","Bangalore","Mumbai","Delhi","Chennai","Hyderabad","Kolkata","Jaipur",
  "Kochi","Agra","Varanasi","Udaipur","Manali","Shimla","Ooty","Kodaikanal",
  "Munnar","Varkala","Alleppey","Coorg","Pondicherry","Port Blair","Leh",
  "Dharamshala","McLeod Ganj","Rishikesh","Haridwar","Mussoorie","Nainital",
  "Pushkar","Jodhpur","Jaisalmer","Bikaner","Mount Abu","Mysore","Hampi",
  "Coimbatore","Trichy","Madurai","Rameshwaram","Tirupati","Pune","Aurangabad",
  "Nashik","Lonavala","Mahabaleshwar","Ahmedabad","Surat","Vadodara",
  "Chandigarh","Amritsar","Lucknow","Mathura","Vrindavan","Ayodhya",
  "Patna","Gaya","Bodh Gaya","Ranchi","Bhubaneswar","Puri","Darjeeling",
  "Gangtok","Shillong","Guwahati","Nagercoil","Kanyakumari","Marthandam",
  "Tirunelveli","Thrissur","Kozhikode","Kollam","Kottayam","Wayanad","Hosur",
  "Dubai","Singapore","Bangkok","London","Paris","Tokyo","Bali","Maldives",
  "Male","Phuket","Kuala Lumpur","Istanbul","Rome","Barcelona","Amsterdam",
  "Sydney","Melbourne","Colombo","Kathmandu","Doha","Abu Dhabi","Muscat",
  "Seoul","Osaka","Hong Kong","New York","Las Vegas","Toronto",
];

// ── LINK BUILDERS ──────────────────────────────────────────────────────────────
function buildFlightLink(fromCode,toCode,dateStr,passengers,cabinClass,directOnly,morningOnly){
  const isIndia=INDIA_IATA.has(fromCode)&&INDIA_IATA.has(toCode);
  const base=isIndia?"https://www.aviasales.in":"https://www.aviasales.com";
  let ddmm="";
  if(dateStr){const d=new Date(dateStr);if(!isNaN(d))ddmm=String(d.getDate()).padStart(2,"0")+String(d.getMonth()+1).padStart(2,"0");}
  let url=`${base}/search/${fromCode}${ddmm}${toCode}${passengers||1}?marker=714667&sub_id=alvryn_web`;
  if(cabinClass&&cabinClass.toLowerCase().includes("business"))url+="&class=business";
  if(cabinClass&&cabinClass.toLowerCase().includes("first"))url+="&class=first";
  if(directOnly)url+="&stops=0";
  return url;
}
function buildBusLink(from,to,dateStr){
  const f=(from||"").toLowerCase().replace(/\s+/g,"-");
  const t=(to||"").toLowerCase().replace(/\s+/g,"-");
  let url=`https://www.redbus.in/bus-tickets/${f}-to-${t}`;
  if(dateStr){const d=new Date(dateStr);if(!isNaN(d)){const dd=String(d.getDate()).padStart(2,"0");const mm=String(d.getMonth()+1).padStart(2,"0");const yyyy=d.getFullYear();url+=`?doj=${dd}-${mm}-${yyyy}`;}}
  return url;
}

function buildTrainLink(from, to, dateStr) {
  // Using IRCTC — RedBus railways URL format is unreliable
  const TC = {
    "bangalore":"SBC","bengaluru":"SBC","yeshwanthpur":"YPR","mumbai":"CSTM",
    "delhi":"NDLS","new delhi":"NDLS","chennai":"MAS","hyderabad":"SC",
    "kolkata":"HWH","pune":"PUNE","kochi":"ERS","jaipur":"JP","varanasi":"BSB",
    "trivandrum":"TVC","coimbatore":"CBE","madurai":"MDU","mysore":"MYS",
    "nagpur":"NGP","bhopal":"BPL","patna":"PNBE","lucknow":"LKO","agra":"AGC",
    "amritsar":"ASR","chandigarh":"CDG","guwahati":"GHY","ranchi":"RNC",
    "visakhapatnam":"VSKP","vijayawada":"BZA","hubli":"UBL","mangalore":"MAQ",
    "surat":"ST","ahmedabad":"ADI","indore":"INDB","dehradun":"DDN",
    "hosur":"HOS","nagercoil":"NCJ","trichy":"TPJ","salem":"SA","erode":"ED",
    "vellore":"KPD","pondicherry":"PDY","tirunelveli":"TEN","kanyakumari":"CAPE",
  };
  const fc = TC[from?.toLowerCase()] || (from||"").slice(0,4).toUpperCase();
  const tc = TC[to?.toLowerCase()] || (to||"").slice(0,4).toUpperCase();
  let dateParam = "";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const dd = String(d.getDate()).padStart(2,"0");
        const mm = String(d.getMonth()+1).padStart(2,"0");
        const yyyy = d.getFullYear();
        dateParam = `&journeyDate=${dd}-${mm}-${yyyy}`;
      }
    } catch {}
  }
  return `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}&isCallFromDpDown=true${dateParam}&quota=GN&class=SL`;
}
function buildHotelLink(city,checkIn,checkOut,guests,rooms){
  let url=`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&group_adults=${guests||1}&no_rooms=${rooms||1}`;
  if(checkIn){const d=new Date(checkIn);if(!isNaN(d))url+=`&checkin=${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
  if(checkOut){const d=new Date(checkOut);if(!isNaN(d))url+=`&checkout=${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
  return url;
}

function searchFlightCities(q){if(!q)return FLIGHT_CITIES.filter(c=>c.top);const ql=q.toLowerCase();return FLIGHT_CITIES.filter(c=>c.name.toLowerCase().includes(ql)||c.code.toLowerCase().includes(ql)||c.country.toLowerCase().includes(ql)||c.full.toLowerCase().includes(ql)).slice(0,12);}
function searchBusCities(q){if(!q)return BUS_CITIES.slice(0,24);const ql=q.toLowerCase();return BUS_CITIES.filter(c=>c.toLowerCase().includes(ql)).slice(0,12);}
function searchTrainCities(q){if(!q)return TRAIN_CITIES.slice(0,20);const ql=q.toLowerCase();return TRAIN_CITIES.filter(c=>c.city.toLowerCase().includes(ql)||c.code.toLowerCase().includes(ql)).slice(0,12);}
function searchHotelCities(q){if(!q)return HOTEL_CITIES.slice(0,20);const ql=q.toLowerCase();return HOTEL_CITIES.filter(c=>c.toLowerCase().includes(ql)).slice(0,12);}

// ── ALVRYN ICON ────────────────────────────────────────────────────────────────
function AlvrynIcon({size=36}){
  const uid=`sp${size}`;
  return(
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{flexShrink:0}}>
      <defs><linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a84c"/><stop offset="50%" stopColor="#f0d080"/>
        <stop offset="100%" stopColor="#8B6914"/>
      </linearGradient></defs>
      <circle cx="32" cy="32" r="30" stroke={`url(#${uid}g)`} strokeWidth="1.2" fill="none"/>
      <path d="M20 46 L28 18 L36 46" stroke={`url(#${uid}g)`} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke={`url(#${uid}g)`} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke={`url(#${uid}g)`} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.45"/>
    </svg>
  );
}

// ── CITY PICKER MODAL (fixed z-index so it stays on top) ──────────────────────
function CityPickerModal({tabId,label,onSelect,onClose,exclude}){
  const [q,setQ]=useState("");
  const ref=useRef(null);
  useEffect(()=>{setTimeout(()=>ref.current?.focus(),80);},[]);
  let results=[];
  if(tabId==="flight")results=searchFlightCities(q).filter(c=>c.code!==exclude);
  else if(tabId==="bus")results=searchBusCities(q).filter(c=>c!==exclude);
  else if(tabId==="train")results=searchTrainCities(q).filter(c=>c.city!==exclude);
  else if(tabId==="hotel")results=searchHotelCities(q).filter(c=>c!==exclude);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,maxHeight:"80vh",background:"#fff",borderRadius:20,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"20px 20px 12px",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#1a1410"}}>Select {label}</div>
            <button onClick={onClose} style={{background:"rgba(0,0,0,0.06)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:"#666",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8f8f8",borderRadius:12,padding:"10px 14px",border:"1.5px solid rgba(201,168,76,0.3)"}}>
            <span style={{opacity:0.4,fontSize:14}}>🔍</span>
            <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder={tabId==="flight"?"Search city, code or country...":"Search city or station..."} style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#1a1410"}}/>
            {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:16,padding:0}}>×</button>}
          </div>
        </div>
        {!q&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#bbb",letterSpacing:"0.12em",padding:"10px 20px 4px",textTransform:"uppercase"}}>Popular Cities</div>}
        <div style={{overflowY:"auto",flex:1,padding:"4px 12px 24px"}}>
          {results.map((item)=>{
            if(tabId==="flight")return(
              <div key={item.code} onClick={()=>onSelect(item)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 10px",borderRadius:12,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.09)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"#1a1410"}}>{item.name}{item.top&&<span style={{fontSize:9,background:"rgba(201,168,76,0.15)",color:"#8B6914",padding:"1px 6px",borderRadius:8,marginLeft:6,fontWeight:700}}>TOP</span>}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{item.full} · {item.country}</div>
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:GOLD_DARK}}>{item.code}</div>
              </div>
            );
            if(tabId==="train")return(
              <div key={item.code} onClick={()=>onSelect(item)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 10px",borderRadius:12,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.09)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:14,fontWeight:500,color:"#1a1410"}}>{item.city}</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,color:GOLD_DARK}}>{item.code}</div>
              </div>
            );
            return(<div key={item} onClick={()=>onSelect(item)} style={{padding:"12px 10px",borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:500,color:"#1a1410",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.09)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{item}</div>);
          })}
          {results.length===0&&q&&<div style={{textAlign:"center",padding:"32px 20px",color:"#aaa",fontSize:13}}>No results for "{q}"</div>}
        </div>
      </div>
    </div>
  );
}

// ── CSS ANIMATIONS ─────────────────────────────────────────────────────────────
// All use transform:translateX so they work reliably in all browsers
const SCENE_CSS = `
@keyframes sc_fly {
  0%   { transform: translateX(-160px) translateY(10px); opacity:0; }
  5%   { opacity:1; }
  50%  { transform: translateX(40vw) translateY(-25px); }
  95%  { opacity:1; }
  100% { transform: translateX(calc(100vw + 160px)) translateY(0px); opacity:0; }
}
@keyframes sc_fly2 {
  0%   { transform: translateX(-100px); opacity:0; }
  6%   { opacity:0.6; }
  94%  { opacity:0.6; }
  100% { transform: translateX(calc(100vw + 100px)); opacity:0; }
}
@keyframes sc_cloud {
  0%   { transform: translateX(110vw); }
  100% { transform: translateX(-350px); }
}
@keyframes sc_star { 0%,100%{opacity:0.2;transform:scale(0.8);}50%{opacity:1;transform:scale(1.2);} }

@keyframes sc_bus {
  0%   { transform: translateX(-200px); opacity:0; }
  4%   { opacity:1; }
  96%  { opacity:1; }
  100% { transform: translateX(calc(100vw + 50px)); opacity:0; }
}
@keyframes sc_road {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-150px); }
}
@keyframes sc_tree { 0%,100%{transform:rotate(-1.5deg);}50%{transform:rotate(1.5deg);} }

@keyframes sc_train {
  0%   { transform: translateX(calc(100vw + 300px)); opacity:0; }
  4%   { opacity:1; }
  96%  { opacity:1; }
  100% { transform: translateX(-300px); opacity:0; }
}
@keyframes sc_track {
  0%   { transform: translateX(0); }
  100% { transform: translateX(120px); }
}
@keyframes sc_steam {
  0%   { opacity:0.7; transform:translateY(0) scale(1); }
  100% { opacity:0; transform:translateY(-40px) scale(2.2); }
}
@keyframes sc_win {
  0%,85%,100%{ opacity:0.12; }
  88%,97%    { opacity:0.95; }
}
@keyframes sc_moon { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }

@keyframes sc_cab {
  0%   { transform: translateX(-160px); opacity:0; }
  4%   { opacity:1; }
  96%  { opacity:1; }
  100% { transform: translateX(calc(100vw + 50px)); opacity:0; }
}
@keyframes sc_gradShift {
  0%,100%{background-position:0% 50%;}
  50%{background-position:100% 50%;}
}
@keyframes sc_fadeUp {
  from{opacity:0;transform:translateY(18px);}
  to{opacity:1;transform:translateY(0);}
}
@keyframes sc_float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }
@keyframes sc_pulse { 0%,100%{opacity:1;}50%{opacity:0.3;} }
`;

// ── FLIGHT SCENE ───────────────────────────────────────────────────────────────
function FlightScene(){
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      {/* Deep blue sky */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#04111f 0%,#0a2240 30%,#1a4a7a 65%,#c9a84c 100%)"}}/>
      {/* Stars */}
      {Array.from({length:40},(_,i)=>(
        <div key={i} style={{position:"absolute",left:`${(i*137.5)%100}%`,top:`${(i*79.3)%65}%`,
          width:i%8===0?2.5:1.5,height:i%8===0?2.5:1.5,borderRadius:"50%",
          background:"rgba(255,255,255,0.9)",
          animation:`sc_star ${1.5+i%3}s ease-in-out ${i*0.18}s infinite`}}/>
      ))}
      {/* Clouds */}
      <div style={{position:"absolute",top:"22%",animation:"sc_cloud 26s linear infinite",width:220,height:50,borderRadius:50,background:"rgba(255,255,255,0.1)"}}/>
      <div style={{position:"absolute",top:"38%",animation:"sc_cloud 18s linear 7s infinite",width:150,height:35,borderRadius:40,background:"rgba(255,255,255,0.07)"}}/>
      <div style={{position:"absolute",top:"55%",animation:"sc_cloud 32s linear 14s infinite",width:100,height:26,borderRadius:30,background:"rgba(255,255,255,0.06)"}}/>
      {/* Gold horizon glow */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"38%",background:"linear-gradient(transparent,rgba(201,168,76,0.18))"}}/>
      {/* Dashed flight path */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.22}} viewBox="0 0 1000 400" preserveAspectRatio="none">
        <path d="M-50 320 Q250 180 500 230 Q750 280 1050 130" stroke="#c9a84c" strokeWidth="2" fill="none" strokeDasharray="14 9"/>
      </svg>
      {/* MAIN AIRCRAFT — moves left → right using translateX ✅ */}
      <div style={{position:"absolute",top:"32%",animation:"sc_fly 11s cubic-bezier(0.4,0,0.6,1) 0.3s infinite",willChange:"transform"}}>
        <svg width="140" height="56" viewBox="0 0 140 56" fill="none">
          {/* Fuselage */}
          <ellipse cx="68" cy="28" rx="62" ry="12" fill="#f2ede0" opacity="0.96"/>
          {/* Nose cone */}
          <path d="M130 28 Q140 28 138 25 L140 28 L138 31 Q140 28 130 28 Z" fill="#f2ede0" opacity="0.96"/>
          {/* Tail fin vertical */}
          <path d="M8 26 L8 12 L22 26 Z" fill={GOLD} opacity="0.92"/>
          {/* Horizontal tail */}
          <path d="M12 26 L4 19 L16 26 Z" fill={GOLD} opacity="0.75"/>
          <path d="M12 30 L4 37 L16 30 Z" fill={GOLD} opacity="0.75"/>
          {/* Main wings sweep back */}
          <path d="M60 25 L16 5 L38 25 Z" fill={GOLD} opacity="0.92"/>
          <path d="M60 31 L16 51 L38 31 Z" fill={GOLD} opacity="0.92"/>
          {/* Engines under wings */}
          <ellipse cx="44" cy="20" rx="12" ry="4.5" fill="#d8d0c0" opacity="0.85"/>
          <ellipse cx="44" cy="36" rx="12" ry="4.5" fill="#d8d0c0" opacity="0.85"/>
          {/* Engine inlet glow */}
          <ellipse cx="33" cy="20" rx="3.5" ry="3.5" fill="rgba(255,200,80,0.75)"/>
          <ellipse cx="33" cy="36" rx="3.5" ry="3.5" fill="rgba(255,200,80,0.75)"/>
          {/* Windows */}
          {[72,82,92,102,112,120].map(cx=>(
            <ellipse key={cx} cx={cx} cy="25" rx="3.5" ry="2.5" fill="rgba(190,225,255,0.75)"/>
          ))}
          {/* Gold stripe */}
          <rect x="6" y="29" width="124" height="2.5" fill={GOLD} opacity="0.55" rx="1"/>
        </svg>
      </div>
      {/* Small distant aircraft */}
      <div style={{position:"absolute",top:"60%",animation:"sc_fly2 18s linear 6s infinite",willChange:"transform"}}>
        <svg width="72" height="30" viewBox="0 0 140 56" fill="none">
          <ellipse cx="68" cy="28" rx="62" ry="12" fill="#f2ede0" opacity="0.7"/>
          <path d="M8 26 L8 12 L22 26 Z" fill={GOLD} opacity="0.7"/>
          <path d="M60 25 L16 5 L38 25 Z" fill={GOLD} opacity="0.7"/>
          <path d="M60 31 L16 51 L38 31 Z" fill={GOLD} opacity="0.7"/>
        </svg>
      </div>
    </div>
  );
}

// ── BUS SCENE ──────────────────────────────────────────────────────────────────
function BusScene(){
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#031a0a 0%,#062e12 35%,#0d4a20 65%,#c9a84c 100%)"}}/>
      {/* Night stars */}
      {Array.from({length:22},(_,i)=>(
        <div key={i} style={{position:"absolute",left:`${(i*157)%100}%`,top:`${(i*83)%50}%`,
          width:1.5,height:1.5,borderRadius:"50%",background:"rgba(255,255,255,0.6)",
          animation:`sc_star ${2+i%3}s ease-in-out ${i*0.22}s infinite`}}/>
      ))}
      {/* Road surface */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"32%",background:"linear-gradient(180deg,rgba(15,40,20,0),rgba(8,20,10,0.9))"}}/>
      <div style={{position:"absolute",bottom:"1%",left:0,right:0,height:"28%",background:"rgba(20,22,18,0.85)",borderTop:"2px solid rgba(201,168,76,0.35)"}}/>
      {/* Road center dashes — move right=bus going right ✅ */}
      <div style={{position:"absolute",bottom:"12%",left:0,right:0,overflow:"hidden",height:5}}>
        <div style={{display:"flex",gap:55,animation:"sc_road 1.5s linear infinite",width:"280%",willChange:"transform"}}>
          {Array.from({length:60},(_,i)=>(
            <div key={i} style={{width:38,height:4,background:GOLD,opacity:0.5,borderRadius:2,flexShrink:0}}/>
          ))}
        </div>
      </div>
      {/* Roadside trees */}
      {[6,18,31,44,57,70,83,95].map((l,i)=>(
        <div key={i} style={{position:"absolute",bottom:"29%",left:`${l}%`,transformOrigin:"bottom center",
          animation:`sc_tree ${2.5+i*0.3}s ease-in-out ${i*0.18}s infinite alternate`}}>
          <div style={{width:5,height:22+i%3*6,background:"rgba(15,60,20,0.75)",margin:"0 auto",borderRadius:"2px 2px 0 0"}}/>
          <div style={{width:22+i%3*4,height:22+i%3*4,background:`rgba(25,${110+i*10},35,0.4)`,borderRadius:"50%",marginTop:-10,marginLeft:-(11+i%3*2)}}/>
        </div>
      ))}
      {/* BUS — moves left→right using translateX ✅ */}
      <div style={{position:"absolute",bottom:"27%",animation:"sc_bus 9s linear infinite",willChange:"transform"}}>
        <svg width="200" height="76" viewBox="0 0 180 68" fill="none">
          {/* Main body */}
          <rect x="4" y="10" width="168" height="38" rx="6" fill="#f0ead8" opacity="0.96"/>
          {/* Roof panel */}
          <rect x="8" y="6" width="160" height="8" rx="3" fill={GOLD} opacity="0.9"/>
          {/* Front face (right) */}
          <path d="M172 10 L176 15 L176 46 L172 48 Z" fill="#e5dc9a" opacity="0.95"/>
          {/* Headlight */}
          <rect x="173" y="19" width="5" height="12" rx="1" fill="rgba(255,240,160,0.95)"/>
          {/* Rear (left) */}
          <rect x="4" y="16" width="5" height="10" rx="1" fill="rgba(220,60,60,0.7)"/>
          {/* Windows */}
          <rect x="16" y="16" width="22" height="16" rx="2.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="44" y="16" width="22" height="16" rx="2.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="72" y="16" width="22" height="16" rx="2.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="100" y="16" width="22" height="16" rx="2.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="128" y="16" width="22" height="16" rx="2.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="152" y="16" width="16" height="16" rx="2.5" fill="rgba(255,200,80,0.55)"/>
          {/* Gold stripe */}
          <rect x="4" y="38" width="168" height="5" fill={GOLD} opacity="0.5" rx="1"/>
          {/* ALVRYN label */}
          <rect x="55" y="40" width="68" height="7" rx="2" fill={GOLD} opacity="0.6"/>
          {/* Wheels */}
          <circle cx="34" cy="56" r="11" fill="#181c18" stroke={GOLD} strokeWidth="2"/>
          <circle cx="34" cy="56" r="4.5" fill={GOLD} opacity="0.65"/>
          <circle cx="140" cy="56" r="11" fill="#181c18" stroke={GOLD} strokeWidth="2"/>
          <circle cx="140" cy="56" r="4.5" fill={GOLD} opacity="0.65"/>
          {/* Wheel shadows */}
          <ellipse cx="34" cy="67" rx="13" ry="3" fill="rgba(0,0,0,0.3)"/>
          <ellipse cx="140" cy="67" rx="13" ry="3" fill="rgba(0,0,0,0.3)"/>
        </svg>
      </div>
      {/* Road glow */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:28,background:`linear-gradient(transparent,rgba(201,168,76,0.12))`}}/>
    </div>
  );
}

// ── HOTEL SCENE ─────────────────────────────────────────────────────────────────
function HotelScene(){
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#05030f 0%,#100828 35%,#1e1050 65%,#c9a84c 100%)"}}/>
      {/* Stars */}
      {Array.from({length:38},(_,i)=>(
        <div key={i} style={{position:"absolute",left:`${(i*113.7)%100}%`,top:`${(i*71.3)%55}%`,
          width:i%7===0?2.5:1.5,height:i%7===0?2.5:1.5,borderRadius:"50%",
          background:"rgba(255,255,255,0.9)",
          animation:`sc_star ${1.2+i%4}s ease-in-out ${i*0.14}s infinite`}}/>
      ))}
      {/* Moon */}
      <div style={{position:"absolute",top:"8%",right:"11%",width:42,height:42,borderRadius:"50%",
        background:"radial-gradient(circle at 38% 38%,rgba(255,235,130,0.45),rgba(255,215,80,0.08))",
        boxShadow:"0 0 35px rgba(255,215,80,0.18)",animation:"sc_moon 6s ease-in-out infinite"}}/>

      {/* ── CITY SKYLINE ── Premium multi-building silhouette */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"68%"}}>
        <svg width="100%" height="100%" viewBox="0 0 1000 380" preserveAspectRatio="xMidYMax meet" fill="none">
          {/* Far background buildings — lighter */}
          <rect x="0"   y="220" width="55"  height="160" rx="2" fill="rgba(18,12,40,0.7)"/>
          <rect x="65"  y="180" width="45"  height="200" rx="2" fill="rgba(18,12,40,0.7)"/>
          <rect x="120" y="200" width="60"  height="180" rx="2" fill="rgba(18,12,40,0.7)"/>
          <rect x="830" y="190" width="50"  height="190" rx="2" fill="rgba(18,12,40,0.7)"/>
          <rect x="890" y="170" width="60"  height="210" rx="2" fill="rgba(18,12,40,0.7)"/>
          <rect x="960" y="210" width="40"  height="170" rx="2" fill="rgba(18,12,40,0.7)"/>

          {/* Mid buildings */}
          <rect x="195" y="160" width="65"  height="220" rx="2" fill="rgba(22,14,52,0.88)"/>
          <rect x="270" y="120" width="80"  height="260" rx="2" fill="rgba(22,14,52,0.88)"/>
          <rect x="730" y="130" width="80"  height="250" rx="2" fill="rgba(22,14,52,0.88)"/>
          <rect x="820" y="155" width="65"  height="225" rx="2" fill="rgba(22,14,52,0.88)"/>

          {/* Antenna on tall buildings */}
          <rect x="302" y="108" width="4" height="14" fill="rgba(201,168,76,0.6)"/>
          <rect x="762" y="118" width="4" height="14" fill="rgba(201,168,76,0.6)"/>

          {/* ── CENTER HOTEL — most detailed ── */}
          <rect x="360" y="60"  width="280" height="320" rx="3" fill="rgba(20,12,50,0.95)"/>
          {/* Hotel gold trim bands */}
          <rect x="360" y="56"  width="280" height="8"  fill={GOLD} opacity="0.85" rx="1"/>
          <rect x="360" y="130" width="280" height="4"  fill={GOLD} opacity="0.4" rx="1"/>
          <rect x="360" y="190" width="280" height="4"  fill={GOLD} opacity="0.4" rx="1"/>
          <rect x="360" y="250" width="280" height="4"  fill={GOLD} opacity="0.4" rx="1"/>
          {/* Antenna */}
          <rect x="496" y="40"  width="6"   height="20"  fill={GOLD} opacity="0.7"/>
          <circle cx="499" cy="38" r="4" fill="rgba(255,100,100,0.8)"/>
          {/* Hotel lobby arch */}
          <rect x="450" y="310" width="100" height="70"  rx="2" fill="rgba(201,168,76,0.15)"/>
          <path d="M450 340 Q500 310 550 340" fill="rgba(201,168,76,0.25)"/>
          {/* Lobby doors */}
          <rect x="462" y="330" width="28" height="50" rx="1" fill="rgba(175,215,255,0.35)"/>
          <rect x="508" y="330" width="28" height="50" rx="1" fill="rgba(175,215,255,0.35)"/>
          {/* Window grid — floor 1 (top) */}
          {[376,414,452,490,528,566,604].map((x,i)=>(
            <rect key={`w1${i}`} x={x} y="72"  width="26" height="38" rx="2"
              fill={`rgba(255,${175+i*8},${45+i*5},0.${i%3===0?'85':'55'})`}
              style={{animation:`sc_win ${2+i*0.4}s ease-in-out ${i*0.3}s infinite`}}/>
          ))}
          {/* Window grid — floor 2 */}
          {[376,414,452,490,528,566,604].map((x,i)=>(
            <rect key={`w2${i}`} x={x} y="140" width="26" height="38" rx="2"
              fill={`rgba(255,${180+i*5},${50+i*4},0.${i%2===0?'75':'45'})`}
              style={{animation:`sc_win ${2.5+i*0.35}s ease-in-out ${i*0.25+0.5}s infinite`}}/>
          ))}
          {/* Window grid — floor 3 */}
          {[376,414,452,490,528,566,604].map((x,i)=>(
            <rect key={`w3${i}`} x={x} y="200" width="26" height="38" rx="2"
              fill={`rgba(255,${170+i*6},${40+i*5},0.${i%3===1?'9':'5'})`}
              style={{animation:`sc_win ${1.8+i*0.45}s ease-in-out ${i*0.35+0.2}s infinite`}}/>
          ))}
          {/* Window grid — floor 4 */}
          {[376,414,452,490,528,566,604].map((x,i)=>(
            <rect key={`w4${i}`} x={x} y="260" width="26" height="38" rx="2"
              fill={`rgba(255,${165+i*7},${42+i*4},0.${i%4===0?'88':'48'})`}
              style={{animation:`sc_win ${2.2+i*0.4}s ease-in-out ${i*0.28+0.8}s infinite`}}/>
          ))}
          {/* Hotel rooftop sign glow */}
          <rect x="430" y="40" width="138" height="18" rx="4" fill="rgba(201,168,76,0.18)"/>
          <text x="499" y="53" textAnchor="middle" fontSize="10" fill="rgba(201,168,76,0.75)" fontFamily="monospace" fontWeight="bold" letterSpacing="2">ALVRYN HOTEL</text>

          {/* Side building windows — left */}
          {[200,230,260].map((y,ri)=>[204,218,232,246].map((x,ci)=>(
            <rect key={`sl${ri}${ci}`} x={x} y={y} width="9" height="13" rx="1"
              fill={`rgba(255,180,50,0.${ri*ci%3===0?'7':'35'})`}
              style={{animation:`sc_win ${2+ri+ci*0.3}s ease-in-out ${(ri+ci)*0.2}s infinite`}}/>
          )))}
          {/* Side building windows — right */}
          {[200,230,260].map((y,ri)=>[738,752,766,780].map((x,ci)=>(
            <rect key={`sr${ri}${ci}`} x={x} y={y} width="9" height="13" rx="1"
              fill={`rgba(255,180,50,0.${(ri+ci)%3===0?'7':'35'})`}
              style={{animation:`sc_win ${2.2+ri+ci*0.3}s ease-in-out ${(ri+ci)*0.18}s infinite`}}/>
          )))}

          {/* Ground / street */}
          <rect x="0" y="375" width="1000" height="5" fill={GOLD} opacity="0.3"/>
        </svg>
      </div>
      {/* Bottom gold glow */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:35,background:`linear-gradient(transparent,rgba(201,168,76,0.15))`}}/>
    </div>
  );
}

// ── TRAIN SCENE ─────────────────────────────────────────────────────────────────
function TrainScene(){
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#05020f 0%,#0e0530 35%,#1a0a50 65%,#c9a84c 100%)"}}/>
      {/* Stars */}
      {Array.from({length:30},(_,i)=>(
        <div key={i} style={{position:"absolute",left:`${(i*97.3)%100}%`,top:`${(i*83.7)%60}%`,
          width:1.5,height:1.5,borderRadius:"50%",background:"rgba(200,165,255,0.75)",
          animation:`sc_star ${1.3+i%3}s ease-in-out ${i*0.16}s infinite`}}/>
      ))}
      {/* Dual track rails */}
      <div style={{position:"absolute",bottom:"26%",left:0,right:0,height:4,background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent)`}}/>
      <div style={{position:"absolute",bottom:"23%",left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,rgba(201,168,76,0.45),transparent)`}}/>
      {/* Track sleepers — move right=train going left ✅ */}
      <div style={{position:"absolute",bottom:"22%",left:0,right:0,overflow:"hidden",height:9}}>
        <div style={{display:"flex",gap:26,animation:"sc_track 1.3s linear infinite",width:"280%",willChange:"transform"}}>
          {Array.from({length:80},(_,i)=>(
            <div key={i} style={{width:9,height:9,background:"rgba(155,115,220,0.45)",borderRadius:1,flexShrink:0}}/>
          ))}
        </div>
      </div>
      {/* TRAIN — moves RIGHT→LEFT using translateX ✅ */}
      <div style={{position:"absolute",bottom:"24%",animation:"sc_train 10s linear 0.5s infinite",willChange:"transform"}}>
        <svg width="320" height="72" viewBox="0 0 320 72" fill="none">
          {/* Engine (left = front since moving left) */}
          <rect x="240" y="8"  width="74"  height="38" rx="5" fill="#f0ebe0" opacity="0.96"/>
          {/* Engine nose (leftmost) */}
          <path d="M314 14 L320 22 L320 30 L314 44 Z" fill={GOLD} opacity="0.9"/>
          {/* Front headlight */}
          <rect x="315" y="23" width="4" height="12" rx="1" fill="rgba(255,245,170,0.98)"/>
          {/* Engine windows */}
          <rect x="248" y="14" width="20" height="14" rx="2" fill="rgba(175,215,255,0.75)"/>
          <rect x="274" y="14" width="20" height="14" rx="2" fill="rgba(175,215,255,0.75)"/>
          <rect x="298" y="14" width="12" height="14" rx="2" fill="rgba(255,200,80,0.6)"/>
          {/* Carriage 1 */}
          <rect x="160" y="8"  width="76"  height="38" rx="2" fill="#e8e2d4" opacity="0.92"/>
          <rect x="168" y="15" width="16" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="190" y="15" width="16" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="212" y="15" width="16" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          {/* Carriage 2 */}
          <rect x="80"  y="8"  width="76"  height="38" rx="2" fill="#e4ddd0" opacity="0.88"/>
          <rect x="88"  y="15" width="16" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="110" y="15" width="16" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="132" y="15" width="16" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          {/* Carriage 3 */}
          <rect x="4"   y="8"  width="72"  height="38" rx="2" fill="#e0d8cc" opacity="0.82"/>
          <rect x="12"  y="15" width="14" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="32"  y="15" width="14" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          <rect x="52"  y="15" width="14" height="13" rx="1.5" fill="rgba(175,215,255,0.65)"/>
          {/* Gold stripe along entire train */}
          <rect x="4" y="30" width="316" height="3.5" fill={GOLD} opacity="0.5" rx="1"/>
          {/* All wheels */}
          {[22,54,100,130,178,208,258,290].map((cx,i)=>(
            <g key={i}>
              <circle cx={cx} cy="50" r="10" fill="#12101e" stroke="rgba(155,115,220,0.75)" strokeWidth="1.8"/>
              <circle cx={cx} cy="50" r="3.5" fill="rgba(155,115,220,0.6)"/>
            </g>
          ))}
          {/* Rear tail light */}
          <rect x="4" y="18" width="4" height="10" rx="1" fill="rgba(220,55,55,0.75)"/>
        </svg>
        {/* Steam puffs — left of engine going left */}
        {[0,1,2].map(i=>(
          <div key={i} style={{position:"absolute",top:-16-i*9,right:14+i*12,
            width:16-i*4,height:16-i*4,borderRadius:"50%",
            background:"rgba(255,255,255,0.2)",
            animation:`sc_steam 1.8s ease-out ${i*0.55}s infinite`}}/>
        ))}
      </div>
      {/* Purple glow on tracks */}
      <div style={{position:"absolute",bottom:"18%",left:0,right:0,height:20,background:"linear-gradient(transparent,rgba(120,80,200,0.12))"}}/>
    </div>
  );
}

// ── CAB SCENE ──────────────────────────────────────────────────────────────────
function CabScene(){
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,#080500 0%,#1a1000 35%,#2e1a00 65%,#c9a84c 100%)"}}/>
      {/* City skyline far background */}
      <svg style={{position:"absolute",bottom:0,left:0,right:0,width:"100%",opacity:0.3}} height="130" viewBox="0 0 1000 130" preserveAspectRatio="none">
        {[[0,70,60,60],[70,40,70,90],[150,55,50,75],[210,20,80,110],[310,50,60,80],
          [390,28,75,102],[480,60,55,70],[550,22,80,108],[650,45,60,85],[720,15,85,115],
          [820,55,60,75],[892,40,70,90],[975,60,50,70]].map(([x,y,w,h],i)=>(
          <rect key={i} x={x} y={y} width={w} height={h} fill="#c9a84c" opacity="0.8"/>
        ))}
      </svg>
      {/* Road */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"30%",background:"rgba(15,10,2,0.88)"}}/>
      <div style={{position:"absolute",bottom:"18%",left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${GOLD}50,transparent)`}}/>
      {/* Road dashes → right */}
      <div style={{position:"absolute",bottom:"13%",left:0,right:0,overflow:"hidden",height:5}}>
        <div style={{display:"flex",gap:52,animation:"sc_road 1.4s linear infinite",width:"280%",willChange:"transform"}}>
          {Array.from({length:60},(_,i)=>(
            <div key={i} style={{width:34,height:3,background:GOLD,opacity:0.45,borderRadius:2,flexShrink:0}}/>
          ))}
        </div>
      </div>
      {/* Street lights */}
      {[8,26,44,62,80,95].map((l,i)=>(
        <div key={i} style={{position:"absolute",bottom:"28%",left:`${l}%`}}>
          <div style={{width:3,height:44,background:"rgba(201,168,76,0.55)",margin:"0 auto"}}/>
          <div style={{width:22,height:3,background:GOLD,opacity:0.65,marginLeft:-9.5,borderRadius:2}}/>
          <div style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,235,150,0.85)",marginLeft:-2,marginTop:-1,boxShadow:"0 0 12px rgba(255,220,100,0.7)"}}/>
        </div>
      ))}
      {/* TAXI CAB — moves left→right using translateX ✅ */}
      <div style={{position:"absolute",bottom:"27%",animation:"sc_cab 9s linear 0.5s infinite",willChange:"transform"}}>
        <svg width="148" height="64" viewBox="0 0 148 64" fill="none">
          {/* Body */}
          <rect x="12" y="22" width="122" height="24" rx="3.5" fill="#f5cc18" opacity="0.96"/>
          {/* Roof */}
          <path d="M22 22 L34 8 L112 8 L124 22 Z" fill="#e8be10" opacity="0.96"/>
          {/* Front windshield */}
          <path d="M112 10 L122 22 L112 22 Z" fill="rgba(175,215,255,0.7)"/>
          {/* Rear windshield */}
          <path d="M36 10 L26 22 L36 22 Z" fill="rgba(175,215,255,0.7)"/>
          {/* Side windows */}
          <rect x="42" y="10" width="24" height="15" rx="2" fill="rgba(175,215,255,0.65)"/>
          <rect x="72" y="10" width="24" height="15" rx="2" fill="rgba(175,215,255,0.65)"/>
          {/* Headlight (front = right) */}
          <ellipse cx="134" cy="30" rx="7" ry="4.5" fill="rgba(255,245,170,0.92)"/>
          {/* Tail light */}
          <rect x="11" y="27" width="4" height="10" rx="1" fill="rgba(220,55,55,0.8)"/>
          {/* TAXI roof sign */}
          <rect x="58" y="2" width="32" height="9" rx="2" fill="rgba(0,0,0,0.55)"/>
          <text x="74" y="10" textAnchor="middle" fontSize="6" fill="rgba(255,220,0,0.95)" fontFamily="monospace" fontWeight="bold">TAXI</text>
          {/* Door line */}
          <line x1="74" y1="22" x2="74" y2="46" stroke="rgba(180,140,0,0.5)" strokeWidth="1"/>
          {/* Wheels */}
          <circle cx="34" cy="48" r="12" fill="#181410" stroke={GOLD} strokeWidth="2"/>
          <circle cx="34" cy="48" r="5" fill={GOLD} opacity="0.65"/>
          <circle cx="112" cy="48" r="12" fill="#181410" stroke={GOLD} strokeWidth="2"/>
          <circle cx="112" cy="48" r="5" fill={GOLD} opacity="0.65"/>
          <ellipse cx="34"  cy="60" rx="13" ry="3" fill="rgba(0,0,0,0.3)"/>
          <ellipse cx="112" cy="60" rx="13" ry="3" fill="rgba(0,0,0,0.3)"/>
        </svg>
      </div>
    </div>
  );
}

// ── POPULAR DATA ───────────────────────────────────────────────────────────────
const POPULAR_FLIGHTS=[
  {from:"BLR",to:"DEL",fromN:"Bangalore",toN:"Delhi",price:"₹2,899",dur:"2h 45m"},
  {from:"BLR",to:"BOM",fromN:"Bangalore",toN:"Mumbai",price:"₹1,899",dur:"1h 45m"},
  {from:"BLR",to:"GOI",fromN:"Bangalore",toN:"Goa",price:"₹2,299",dur:"1h 10m"},
  {from:"BLR",to:"DXB",fromN:"Bangalore",toN:"Dubai",price:"₹12,499",dur:"3h 30m"},
  {from:"DEL",to:"BOM",fromN:"Delhi",toN:"Mumbai",price:"₹2,499",dur:"2h 10m"},
  {from:"BOM",to:"GOI",fromN:"Mumbai",toN:"Goa",price:"₹1,599",dur:"1h"},
];
const POPULAR_BUSES=[
  {from:"Bangalore",to:"Chennai",price:"₹550",dur:"5h 30m",ops:"VRL / KSRTC"},
  {from:"Bangalore",to:"Goa",price:"₹900",dur:"9h",ops:"Neeta Tours"},
  {from:"Bangalore",to:"Hyderabad",price:"₹799",dur:"8h",ops:"SRS Travels"},
  {from:"Bangalore",to:"Mumbai",price:"₹1,399",dur:"16h",ops:"VRL Travels"},
  {from:"Chennai",to:"Bangalore",price:"₹630",dur:"5h 30m",ops:"VRL / TNSTC"},
  {from:"Hyderabad",to:"Vijayawada",price:"₹350",dur:"4h",ops:"TSRTC"},
];
const POPULAR_TRAINS=[
  {from:"SBC",to:"MAS",fromN:"Bangalore",toN:"Chennai",price:"₹225",dur:"5h",train:"Shatabdi"},
  {from:"NDLS",to:"CSTM",fromN:"Delhi",toN:"Mumbai",price:"₹450",dur:"16h",train:"Rajdhani"},
  {from:"SBC",to:"YPR",fromN:"Bangalore",toN:"Delhi",price:"₹650",dur:"32h",train:"Karnataka Exp"},
  {from:"SBC",to:"ERS",fromN:"Bangalore",toN:"Kochi",price:"₹280",dur:"11h",train:"Island Exp"},
  {from:"HWH",to:"MAS",fromN:"Kolkata",toN:"Chennai",price:"₹550",dur:"26h",train:"Coromandel"},
  {from:"CSTM",to:"PUNE",fromN:"Mumbai",toN:"Pune",price:"₹85",dur:"3h",train:"Deccan Queen"},
];
const POPULAR_HOTELS=[
  {city:"Goa",type:"Beach Resort",price:"₹2,200",rating:"4.5",img:"🏖️"},
  {city:"Manali",type:"Mountain Stay",price:"₹1,800",rating:"4.3",img:"🏔️"},
  {city:"Bangalore",type:"Business Hotel",price:"₹2,800",rating:"4.4",img:"🏙️"},
  {city:"Jaipur",type:"Heritage Hotel",price:"₹2,500",rating:"4.6",img:"🏰"},
  {city:"Kerala",type:"Backwater Resort",price:"₹3,200",rating:"4.7",img:"🌴"},
  {city:"Dubai",type:"Luxury Hotel",price:"₹8,500",rating:"4.8",img:"🌆"},
];

// Best places this month — June
const BEST_PLACES_MONTH = {
  month: "June",
  domestic: [
    {dest:"Manali",state:"Himachal Pradesh",why:"Perfect summer escape, lush green valleys",budget:"₹8,000–₹18,000",tag:"🏔️ Hill Station",from:"Delhi",searchCity:"Manali"},
    {dest:"Coorg",state:"Karnataka",why:"Coffee estates & waterfalls, monsoon magic",budget:"₹6,000–₹14,000",tag:"🌿 Nature",from:"Bangalore",searchCity:"Coorg"},
    {dest:"Darjeeling",state:"West Bengal",why:"Tea gardens, cool weather, stunning views",budget:"₹10,000–₹20,000",tag:"🍵 Hill Station",from:"Kolkata",searchCity:"Darjeeling"},
    {dest:"Andaman",state:"Andaman Islands",why:"Crystal clear water before peak crowds",budget:"₹15,000–₹30,000",tag:"🏝️ Island",from:"Chennai",searchCity:"Port Blair"},
    {dest:"Ladakh",state:"Jammu & Kashmir",why:"Season just opens — dramatic landscapes",budget:"₹18,000–₹35,000",tag:"🏔️ Adventure",from:"Delhi",searchCity:"Leh"},
    {dest:"Rishikesh",state:"Uttarakhand",why:"Adventure activities & yoga by Ganga",budget:"₹5,000–₹12,000",tag:"🧘 Spiritual",from:"Delhi",searchCity:"Rishikesh"},
  ],
  international: [
    {dest:"Bali",country:"Indonesia",why:"Off-peak prices, less crowds, lush green",budget:"₹25,000–₹55,000",tag:"🌺 Tropical",searchCity:"Bali"},
    {dest:"Singapore",country:"Singapore",why:"Indoor attractions shine during monsoon",budget:"₹40,000–₹80,000",tag:"🦁 City",searchCity:"Singapore"},
    {dest:"Istanbul",country:"Turkey",why:"Mild weather, fewer tourists, great prices",budget:"₹45,000–₹90,000",tag:"🕌 Culture",searchCity:"Istanbul"},
    {dest:"Kyoto",country:"Japan",why:"Rainy season beauty, uncrowded temples",budget:"₹60,000–₹1.2L",tag:"🌸 Culture",searchCity:"Tokyo"},
    {dest:"Maldives",country:"Maldives",why:"Off-season deals — 30-40% cheaper resorts",budget:"₹40,000–₹1L",tag:"🏝️ Luxury",searchCity:"Male"},
    {dest:"Dubai",country:"UAE",why:"Indoor attractions, mega sales, cool malls",budget:"₹35,000–₹70,000",tag:"🌆 Shopping",searchCity:"Dubai"},
  ],
};

const TIPS=[
  {icon:"💡",title:"Book early, save big",desc:"Booking flights 3-6 weeks early saves up to 40% on most Indian routes."},
  {icon:"📅",title:"Best days to fly",desc:"Tuesday & Wednesday flights are typically 15-25% cheaper than weekends."},
  {icon:"🌙",title:"Overnight buses = savings",desc:"Take an overnight sleeper bus — saves one hotel night automatically!"},
  {icon:"⚡",title:"Use ALVI",desc:"Type naturally — AI plans your complete door-to-door trip instantly."},
  {icon:"🔔",title:"Set price alerts",desc:"Track your route in AI Chat and get notified when prices drop."},
  {icon:"🎒",title:"Pack light = save more",desc:"Cabin baggage only saves ₹600-2,000 per flight on low-cost carriers."},
];

const HERO_BG = {
  flight:"linear-gradient(160deg,#04111f 0%,#0a2240 40%,#1a4a7a 70%,#c9a84c 100%)",
  bus:   "linear-gradient(160deg,#031a0a 0%,#062e12 40%,#0d4a20 70%,#c9a84c 100%)",
  hotel: "linear-gradient(160deg,#05030f 0%,#100828 40%,#1e1050 70%,#c9a84c 100%)",
  train: "linear-gradient(160deg,#05020f 0%,#0e0530 40%,#1a0a50 70%,#c9a84c 100%)",
  cab:   "linear-gradient(160deg,#080500 0%,#1a1000 40%,#2e1a00 70%,#c9a84c 100%)",
};
const HERO_TAG = {
  flight:"Fly to 60+ destinations worldwide",
  bus:   "Comfortable buses across 300+ routes",
  hotel: "Best stays from budget to luxury",
  train: "Book trains with pre-filled routes",
  cab:   "Airport transfers & city rides",
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function SearchPage(){
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [tab, setTab] = useState("flight");

  // Flight
  const [fromCity,setFromCity] = useState(FLIGHT_CITIES[0]);
  const [toCity,setToCity]     = useState(FLIGHT_CITIES[1]);
  const [date,setDate]         = useState("");
  const [returnDate,setReturnDate] = useState("");
  const [tripType,setTripType] = useState("oneway");
  const [passengers,setPassengers] = useState(1);
  const [cabinClass,setCabinClass] = useState("Economy");
  const [directOnly,setDirectOnly] = useState(false);
  const [morningOnly,setMorningOnly] = useState(false);

  // Bus
  const [busFrom,setBusFrom] = useState("Bangalore");
  const [busTo,setBusTo]     = useState("Chennai");
  const [busDate,setBusDate] = useState("");

  // Train
  const [trainFrom,setTrainFrom] = useState(TRAIN_CITIES[0]);
  const [trainTo,setTrainTo]     = useState(TRAIN_CITIES[1]);
  const [trainDate,setTrainDate] = useState("");

  // Hotel
  const [hotelCity,setHotelCity]   = useState("Goa");
  const [checkIn,setCheckIn]       = useState("");
  const [checkOut,setCheckOut]     = useState("");
  const [hotelGuests,setHotelGuests] = useState(1);
  const [hotelRooms,setHotelRooms]   = useState(1);

  // Pickers
  const [showFromP,setShowFromP]       = useState(false);
  const [showToP,setShowToP]           = useState(false);
  const [showBusFromP,setShowBusFromP] = useState(false);
  const [showBusToP,setShowBusToP]     = useState(false);
  const [showTrainFromP,setShowTrainFromP] = useState(false);
  const [showTrainToP,setShowTrainToP]     = useState(false);
  const [showHotelP,setShowHotelP]     = useState(false);

  // Best places filter
  const [placesType,setPlacesType] = useState("domestic");

  useEffect(()=>{
    fetch(`${API}/test`).catch(()=>{});
    const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000);
    return()=>clearInterval(t);
  },[]);

  let user={};
  try{user=JSON.parse(localStorage.getItem("user")||"{}");}catch{}

  const handleSearch=()=>{
    if(tab==="flight") window.open(buildFlightLink(fromCity.code,toCity.code,date,passengers,cabinClass,directOnly,morningOnly),"_blank","noopener,noreferrer");
    else if(tab==="bus") window.open(buildBusLink(busFrom,busTo,busDate),"_blank","noopener,noreferrer");
    else if(tab==="train") window.open(buildTrainLink(trainFrom.city,trainTo.city,trainDate),"_blank","noopener,noreferrer");
    else if(tab==="hotel") window.open(buildHotelLink(hotelCity,checkIn,checkOut,hotelGuests,hotelRooms),"_blank","noopener,noreferrer");
  };

  const CountBtn=({val,set,min=1,max=9})=>(
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <button onClick={()=>set(v=>Math.max(min,v-1))} style={{width:30,height:30,borderRadius:"50%",background:`rgba(201,168,76,0.12)`,border:`1.5px solid ${GOLD}`,color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,lineHeight:1}}>−</button>
      <span style={{fontFamily:"'Space Mono',sans-serif",fontSize:18,fontWeight:700,color:"#1a1410",minWidth:22,textAlign:"center"}}>{val}</span>
      <button onClick={()=>set(v=>Math.min(max,v+1))} style={{width:30,height:30,borderRadius:"50%",background:`rgba(201,168,76,0.12)`,border:`1.5px solid ${GOLD}`,color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,lineHeight:1}}>+</button>
    </div>
  );

  const Toggle=({label,checked,onChange,note})=>(
    <button onClick={()=>onChange(!checked)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,border:checked?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.1)",background:checked?`rgba(201,168,76,0.1)`:"#fafaf8",cursor:"pointer",transition:"all 0.18s"}}>
      <div style={{width:32,height:18,borderRadius:9,background:checked?GOLD:"rgba(0,0,0,0.12)",position:"relative",transition:"background 0.2s",flexShrink:0}}>
        <div style={{position:"absolute",top:2,left:checked?14:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:checked?GOLD_DARK:"#555",fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
        {note&&<div style={{fontSize:10,color:"#aaa",marginTop:1}}>{note}</div>}
      </div>
    </button>
  );

  const box={background:"rgba(255,255,255,0.92)",backdropFilter:"blur(8px)",border:"1px solid rgba(201,168,76,0.22)",borderRadius:12,padding:"12px 16px",transition:"border-color 0.2s"};
  const inp={background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#1a1410",width:"100%",cursor:"pointer"};
  const lbl={fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#888",letterSpacing:"0.1em",marginBottom:6,display:"block",textTransform:"uppercase"};

  const SceneMap={flight:<FlightScene/>,bus:<BusScene/>,hotel:<HotelScene/>,train:<TrainScene/>,cab:<CabScene/>};

  return(
    <div style={{minHeight:"100vh",background:"#faf8f4",fontFamily:"'DM Sans',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:2px;}
        ${SCENE_CSS}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5) sepia(1) saturate(3) hue-rotate(5deg);cursor:pointer;}
        .sp_citybtn:hover{border-color:rgba(201,168,76,0.6)!important;background:rgba(201,168,76,0.07)!important;}
        .sp_tabBtn:hover{background:rgba(201,168,76,0.12)!important;}
        .sp_card:hover{transform:translateY(-4px)!important;box-shadow:0 12px 32px rgba(0,0,0,0.13)!important;}
        .sp_searchBtn:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(201,168,76,0.55)!important;}
        .sp_placeCard:hover{transform:translateY(-4px)!important;box-shadow:0 10px 30px rgba(0,0,0,0.12)!important;}
      `}</style>

      {/* CITY PICKERS */}
      {showFromP&&<CityPickerModal tabId="flight" label="Departure City" exclude={toCity.code} onSelect={c=>{setFromCity(c);setShowFromP(false);}} onClose={()=>setShowFromP(false)}/>}
      {showToP&&<CityPickerModal tabId="flight" label="Destination City" exclude={fromCity.code} onSelect={c=>{setToCity(c);setShowToP(false);}} onClose={()=>setShowToP(false)}/>}
      {showBusFromP&&<CityPickerModal tabId="bus" label="Departure City" exclude={busTo} onSelect={c=>{setBusFrom(c);setShowBusFromP(false);}} onClose={()=>setShowBusFromP(false)}/>}
      {showBusToP&&<CityPickerModal tabId="bus" label="Destination City" exclude={busFrom} onSelect={c=>{setBusTo(c);setShowBusToP(false);}} onClose={()=>setShowBusToP(false)}/>}
      {showTrainFromP&&<CityPickerModal tabId="train" label="From Station" exclude={trainTo.city} onSelect={c=>{setTrainFrom(c);setShowTrainFromP(false);}} onClose={()=>setShowTrainFromP(false)}/>}
      {showTrainToP&&<CityPickerModal tabId="train" label="To Station" exclude={trainFrom.city} onSelect={c=>{setTrainTo(c);setShowTrainToP(false);}} onClose={()=>setShowTrainToP(false)}/>}
      {showHotelP&&<CityPickerModal tabId="hotel" label="City / Destination" onSelect={c=>{setHotelCity(c);setShowHotelP(false);}} onClose={()=>setShowHotelP(false)}/>}

      {/* ══ HERO ══ */}
      <div style={{position:"relative",minHeight:"96vh",background:HERO_BG[tab],backgroundSize:"200% 200%",animation:"sc_gradShift 10s ease infinite",overflow:"hidden",transition:"background 0.8s ease"}}>
        {SceneMap[tab]}
        {/* Subtle dark overlay — just enough for readability */}
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",transition:"background 0.5s"}}/>
        {/* Bottom fade */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:80,background:"linear-gradient(transparent,#faf8f4)"}}/>

        {/* NAV */}
        <nav style={{position:"relative",zIndex:10,padding:"16px 5%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
            <div style={{animation:"sc_float 4s ease-in-out infinite"}}><AlvrynIcon size={38}/></div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:"#fff",letterSpacing:"0.12em",textShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>ALVRYN</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.2em"}}>TRAVEL BEYOND</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>navigate("/go/ai")} style={{padding:"8px 16px",background:"rgba(201,168,76,0.2)",border:"1.5px solid rgba(201,168,76,0.45)",borderRadius:10,color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",backdropFilter:"blur(8px)"}}>🤖 AI Chat</button>
            <button onClick={()=>navigate("/go/profile")} style={{padding:"8px 14px",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.22)",borderRadius:10,color:"rgba(255,255,255,0.88)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",backdropFilter:"blur(8px)"}}>Profile</button>
            <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/go/login");}} style={{padding:"8px 14px",background:"rgba(200,50,50,0.12)",border:"1px solid rgba(200,70,70,0.28)",borderRadius:10,color:"rgba(255,130,130,0.88)",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",backdropFilter:"blur(8px)"}}>Sign Out</button>
          </div>
        </nav>

        {/* HERO TEXT */}
        <div style={{position:"relative",zIndex:2,padding:"18px 5% 0",animation:"sc_fadeUp 0.6s both"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD,letterSpacing:"0.22em",marginBottom:6,textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>✦ SEARCH TRAVEL</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(26px,4.5vw,52px)",color:"#fff",marginBottom:4,textShadow:"0 2px 12px rgba(0,0,0,0.5)",lineHeight:1.1}}>
            Hey {user.name?.split(" ")[0]||"Traveller"} 👋
          </h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.65)",marginBottom:14}}>{HERO_TAG[tab]}</p>
        </div>

        {/* SEARCH CARD */}
        <div style={{position:"relative",zIndex:2,maxWidth:900,margin:"0 auto",padding:"0 5%"}}>

          {/* TAB BAR */}
          <div style={{display:"flex",background:"rgba(255,255,255,0.16)",backdropFilter:"blur(14px)",borderRadius:"16px 16px 0 0",overflow:"hidden",border:"1px solid rgba(255,255,255,0.18)",borderBottom:"none"}}>
            {[{id:"flight",icon:"✈️",label:"Flights"},{id:"bus",icon:"🚌",label:"Buses"},{id:"hotel",icon:"🏨",label:"Hotels"},{id:"train",icon:"🚂",label:"Trains"},{id:"cab",icon:"🚖",label:"Cabs",soon:true}].map(t=>(
              <button key={t.id} className="sp_tabBtn" onClick={()=>setTab(t.id)}
                style={{flex:1,padding:"13px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",borderRadius:0,
                  background:tab===t.id?"rgba(255,255,255,0.96)":"transparent",
                  borderBottom:tab===t.id?`3px solid ${GOLD}`:"3px solid transparent",
                  color:tab===t.id?GOLD_DARK:"rgba(255,255,255,0.75)",
                  fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,transition:"all 0.2s",cursor:"pointer",whiteSpace:"nowrap"}}>
                <span style={{fontSize:20,transition:"transform 0.2s",transform:tab===t.id?"scale(1.15)":"scale(1)"}}>{t.icon}</span>
                <span>{t.label}</span>
                {t.soon&&<span style={{fontSize:7,background:"rgba(201,168,76,0.2)",color:GOLD,padding:"1px 5px",borderRadius:6,border:`1px solid ${GOLD}55`}}>SOON</span>}
              </button>
            ))}
          </div>

          {/* FORM */}
          <div style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(20px)",borderRadius:"0 0 20px 20px",padding:"22px 20px",boxShadow:"0 16px 50px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.14)",borderTop:"none"}}>

            {/* FLIGHT */}
            {tab==="flight"&&(<>
              <div style={{display:"flex",gap:6,marginBottom:16,background:"rgba(201,168,76,0.08)",borderRadius:10,padding:4}}>
                {["oneway","roundtrip"].map(t=>(
                  <button key={t} onClick={()=>setTripType(t)} style={{flex:1,padding:"8px",border:"none",borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.2s",background:tripType===t?"#fff":"transparent",color:tripType===t?GOLD_DARK:"#888",boxShadow:tripType===t?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>
                    {t==="oneway"?"One Way":"Round Trip"}
                  </button>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}} className="sp-fto">
                <div>
                  <label style={lbl}>From</label>
                  <div className="sp_citybtn" onClick={()=>setShowFromP(true)} style={{...box,cursor:"pointer"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700,color:"#1a1410",lineHeight:1}}>{fromCity.code}</div>
                    <div style={{fontSize:12,color:"#888",marginTop:3}}>{fromCity.name}</div>
                    <div style={{fontSize:10,color:"#bbb",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fromCity.full}</div>
                  </div>
                </div>
                <button onClick={()=>{const t=fromCity;setFromCity(toCity);setToCity(t);}} style={{width:38,height:38,borderRadius:"50%",background:GRAD,border:"none",color:"#1a1410",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 12px rgba(201,168,76,0.4)`,marginTop:22,transition:"transform 0.3s",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                <div>
                  <label style={lbl}>To</label>
                  <div className="sp_citybtn" onClick={()=>setShowToP(true)} style={{...box,cursor:"pointer"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700,color:"#1a1410",lineHeight:1}}>{toCity.code}</div>
                    <div style={{fontSize:12,color:"#888",marginTop:3}}>{toCity.name}</div>
                    <div style={{fontSize:10,color:"#bbb",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{toCity.full}</div>
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:tripType==="roundtrip"?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                <div><label style={lbl}>Departure *</label><div style={box}><input type="date" value={date} min={today} onChange={e=>setDate(e.target.value)} style={inp}/></div></div>
                {tripType==="roundtrip"&&<div><label style={lbl}>Return</label><div style={box}><input type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)} style={inp}/></div></div>}
                <div><label style={lbl}>Travellers</label><div style={box}><CountBtn val={passengers} set={setPassengers}/></div></div>
                <div><label style={lbl}>Class</label><div style={box}><select value={cabinClass} onChange={e=>setCabinClass(e.target.value)} style={{...inp,color:"#1a1410"}}>{["Economy","Premium Economy","Business","First Class"].map(c=><option key={c}>{c}</option>)}</select></div></div>
              </div>
              {/* Quick Filters */}
              <div style={{marginBottom:16}}>
                <label style={lbl}>Quick Filters</label>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <Toggle label="Direct Flights Only" checked={directOnly} onChange={setDirectOnly} note="No layovers"/>
                  <Toggle label="Morning Departures" checked={morningOnly} onChange={setMorningOnly} note="5 AM – 12 PM"/>
                </div>
              </div>
              <button className="sp_searchBtn" onClick={handleSearch} style={{width:"100%",padding:"16px",borderRadius:13,fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"sc_gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.42)`,transition:"transform 0.2s,box-shadow 0.2s"}}>
                Search Flights ✈
              </button>
              <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:10}}>Best fares on our partner site · Prices may vary</p>
            </>)}

            {/* BUS */}
            {tab==="bus"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:14}}>
                <div><label style={lbl}>From</label><div className="sp_citybtn" onClick={()=>setShowBusFromP(true)} style={{...box,cursor:"pointer"}}><div style={{fontSize:17,fontWeight:700,color:"#1a1410"}}>{busFrom}</div><div style={{fontSize:11,color:"#bbb",marginTop:3}}>Tap to change</div></div></div>
                <button onClick={()=>{const t=busFrom;setBusFrom(busTo);setBusTo(t);}} style={{width:38,height:38,borderRadius:"50%",background:GRAD,border:"none",color:"#1a1410",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 12px rgba(201,168,76,0.4)`,marginTop:22,transition:"transform 0.3s",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                <div><label style={lbl}>To</label><div className="sp_citybtn" onClick={()=>setShowBusToP(true)} style={{...box,cursor:"pointer"}}><div style={{fontSize:17,fontWeight:700,color:"#1a1410"}}>{busTo}</div><div style={{fontSize:11,color:"#bbb",marginTop:3}}>Tap to change</div></div></div>
              </div>
              <div style={{marginBottom:18}}><label style={lbl}>Date of Journey *</label><div style={box}><input type="date" value={busDate} min={today} onChange={e=>setBusDate(e.target.value)} style={{...inp,fontSize:15}}/></div></div>
              <button className="sp_searchBtn" onClick={handleSearch} style={{width:"100%",padding:"16px",borderRadius:13,fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"sc_gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.42)`,transition:"transform 0.2s,box-shadow 0.2s"}}>
                Search Buses 🚌
              </button>
              <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:10}}>Live seats & prices on RedBus</p>
            </>)}

            {/* HOTEL */}
            {tab==="hotel"&&(<>
              <div style={{marginBottom:14}}><label style={lbl}>Destination</label>
                <div className="sp_citybtn" onClick={()=>setShowHotelP(true)} style={{...box,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>🏨</span><div><div style={{fontSize:17,fontWeight:700,color:"#1a1410"}}>{hotelCity}</div><div style={{fontSize:11,color:"#bbb",marginTop:2}}>Tap to change city</div></div></div>
                  <span style={{color:"#bbb",fontSize:18}}>›</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div><label style={lbl}>Check-In *</label><div style={box}><input type="date" value={checkIn} min={today} onChange={e=>setCheckIn(e.target.value)} style={{...inp,fontSize:14}}/></div></div>
                <div><label style={lbl}>Check-Out</label><div style={box}><input type="date" value={checkOut} min={checkIn||today} onChange={e=>setCheckOut(e.target.value)} style={{...inp,fontSize:14}}/></div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
                <div><label style={lbl}>Guests</label><div style={box}><CountBtn val={hotelGuests} set={setHotelGuests} max={10}/></div></div>
                <div><label style={lbl}>Rooms</label><div style={box}><CountBtn val={hotelRooms} set={setHotelRooms} max={10}/></div></div>
              </div>
              <button className="sp_searchBtn" onClick={handleSearch} style={{width:"100%",padding:"16px",borderRadius:13,fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"sc_gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.42)`,transition:"transform 0.2s,box-shadow 0.2s"}}>
                Search Hotels 🏨
              </button>
              <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:10}}>Best prices on Booking.com</p>
            </>)}

            {/* TRAIN */}
            {tab==="train"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:14}}>
                <div><label style={lbl}>From Station</label><div className="sp_citybtn" onClick={()=>setShowTrainFromP(true)} style={{...box,cursor:"pointer"}}><div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:"#1a1410"}}>{trainFrom.code}</div><div style={{fontSize:12,color:"#888",marginTop:3}}>{trainFrom.city}</div></div></div>
                <button onClick={()=>{const t=trainFrom;setTrainFrom(trainTo);setTrainTo(t);}} style={{width:38,height:38,borderRadius:"50%",background:GRAD,border:"none",color:"#1a1410",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 12px rgba(201,168,76,0.4)`,marginTop:22,transition:"transform 0.3s",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                <div><label style={lbl}>To Station</label><div className="sp_citybtn" onClick={()=>setShowTrainToP(true)} style={{...box,cursor:"pointer"}}><div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:"#1a1410"}}>{trainTo.code}</div><div style={{fontSize:12,color:"#888",marginTop:3}}>{trainTo.city}</div></div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
                <div><label style={lbl}>Journey Date</label><div style={box}><input type="date" value={trainDate} min={today} onChange={e=>setTrainDate(e.target.value)} style={{...inp,fontSize:14}}/></div></div>
                <div><label style={lbl}>Class</label><div style={box}><select style={{...inp,color:"#1a1410"}}><option>SL - Sleeper</option><option>3A - AC 3 Tier</option><option>2A - AC 2 Tier</option><option>1A - AC First Class</option><option>CC - Chair Car</option></select></div></div>
              </div>
              <button className="sp_searchBtn" onClick={handleSearch} style={{width:"100%",padding:"16px",borderRadius:13,fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"sc_gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.42)`,transition:"transform 0.2s,box-shadow 0.2s"}}>
                Search Trains 🚂
              </button>
              <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:10}}>Via RedBus Railways · IRCTC authorised partner</p>
            </>)}

            {/* CAB */}
            {tab==="cab"&&(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:52,marginBottom:14,animation:"sc_float 3s ease-in-out infinite"}}>🚖</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:"#1a1410",marginBottom:8}}>Cab Booking</div>
                <div style={{fontSize:14,color:"#888",lineHeight:1.7,maxWidth:320,margin:"0 auto 20px"}}>Airport transfers and intercity cabs — coming very soon!</div>
                <div style={{display:"inline-block",background:`rgba(201,168,76,0.1)`,border:`1px solid ${GOLD}55`,color:GOLD_DARK,padding:"8px 20px",borderRadius:20,fontSize:12,fontFamily:"'Space Mono',monospace",letterSpacing:"0.8px"}}>✦ Coming Soon</div>
                <div style={{marginTop:16,fontSize:13,color:"#aaa"}}>Meanwhile, use <span style={{color:GOLD_DARK,cursor:"pointer",fontWeight:600}} onClick={()=>navigate("/go/ai")}>ALVI</span> to plan your door-to-door trip!</div>
              </div>
            )}
          </div>

          {/* AI BANNER */}
          <div onClick={()=>navigate("/go/ai")} style={{marginTop:14,background:"rgba(255,255,255,0.14)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.22)",borderRadius:14,padding:"13px 18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.2s",marginBottom:40}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.14)"}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🤖</span>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Plan with ALVI — Complete door-to-door trip planning</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",marginTop:1}}>Any language · Any destination · Understands everything you say</div>
              </div>
            </div>
            <span style={{color:GOLD,fontSize:13,fontWeight:600,whiteSpace:"nowrap",marginLeft:12}}>Chat now →</span>
          </div>
        </div>
      </div>

      {/* ══ BELOW FOLD ══ */}
      <div style={{background:"#faf8f4",padding:"52px 5% 80px",maxWidth:1100,margin:"0 auto"}}>

        {/* POPULAR ROUTES */}
        <div style={{marginBottom:52}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:GOLD_DARK,letterSpacing:"0.2em",marginBottom:6}}>
            {tab==="flight"?"✈️ TRENDING FLIGHTS":tab==="bus"?"🚌 POPULAR BUS ROUTES":tab==="train"?"🚂 POPULAR TRAINS":"🏨 TOP DESTINATIONS"}
          </div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"clamp(20px,3vw,32px)",color:"#1a1410",marginBottom:20}}>
            {tab==="flight"?"Popular Flights This Week":tab==="bus"?"Top Bus Routes":tab==="train"?"Trending Train Routes":"Popular Hotel Destinations"}
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
            {(tab==="flight"?POPULAR_FLIGHTS:tab==="bus"?POPULAR_BUSES:tab==="train"?POPULAR_TRAINS:POPULAR_HOTELS).map((r,i)=>(
              <div key={i} className="sp_card" onClick={()=>{
                if(tab==="flight"){setFromCity(FLIGHT_CITIES.find(c=>c.code===r.from)||FLIGHT_CITIES[0]);setToCity(FLIGHT_CITIES.find(c=>c.code===r.to)||FLIGHT_CITIES[1]);window.scrollTo({top:0,behavior:"smooth"});}
                else if(tab==="bus"){setBusFrom(r.from);setBusTo(r.to);window.scrollTo({top:0,behavior:"smooth"});}
                else if(tab==="train"){setTrainFrom(TRAIN_CITIES.find(c=>c.code===r.from)||TRAIN_CITIES[0]);setTrainTo(TRAIN_CITIES.find(c=>c.code===r.to)||TRAIN_CITIES[1]);window.scrollTo({top:0,behavior:"smooth"});}
                else{setHotelCity(r.city);window.scrollTo({top:0,behavior:"smooth"});}
              }} style={{background:"#fff",borderRadius:16,padding:"18px 16px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"1px solid rgba(201,168,76,0.12)",cursor:"pointer",transition:"transform 0.22s,box-shadow 0.22s"}}>
                {tab==="hotel"?(
                  <><div style={{fontSize:28,marginBottom:10}}>{r.img}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:"#1a1410",marginBottom:4}}>{r.city}</div>
                  <div style={{fontSize:12,color:"#888",marginBottom:8}}>{r.type}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:GOLD_DARK}}>from {r.price}<span style={{fontSize:11,color:"#aaa",fontFamily:"'DM Sans',sans-serif"}}>/night</span></div>
                    <div style={{fontSize:12,color:"#22c55e",fontWeight:600}}>⭐ {r.rating}</div>
                  </div></>
                ):(
                  <><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div><div style={{fontSize:13,fontWeight:700,color:"#1a1410"}}>{r.fromN||r.from}</div><div style={{fontSize:11,color:"#bbb",marginTop:1}}>→ {r.toN||r.to}</div></div>
                    <div style={{fontSize:20}}>{tab==="flight"?"✈️":tab==="bus"?"🚌":"🚂"}</div>
                  </div>
                  {(r.train||r.ops)&&<div style={{fontSize:11,color:"#888",marginBottom:8}}>{r.train||r.ops}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:18,color:GOLD_DARK}}>from {r.price}</div>
                    <div style={{fontSize:11,color:"#888"}}>{r.dur}</div>
                  </div></>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BEST PLACES THIS MONTH */}
        <div style={{marginBottom:52}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:GOLD_DARK,letterSpacing:"0.2em",marginBottom:6}}>🗺️ TRAVEL INSPIRATION</div>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"clamp(20px,3vw,32px)",color:"#1a1410"}}>
              Best Places to Visit in {BEST_PLACES_MONTH.month}
            </h2>
            <div style={{display:"flex",gap:6,background:"rgba(201,168,76,0.08)",borderRadius:10,padding:4}}>
              {["domestic","international"].map(t=>(
                <button key={t} onClick={()=>setPlacesType(t)} style={{padding:"7px 16px",border:"none",borderRadius:7,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.2s",background:placesType===t?"#fff":"transparent",color:placesType===t?GOLD_DARK:"#888",boxShadow:placesType===t?"0 2px 8px rgba(0,0,0,0.07)":"none"}}>
                  {t==="domestic"?"🇮🇳 India":"🌍 International"}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
            {BEST_PLACES_MONTH[placesType].map((p,i)=>(
              <div key={i} className="sp_placeCard" onClick={()=>{
                setHotelCity(p.searchCity||p.dest);
                setTab("hotel");
                window.scrollTo({top:0,behavior:"smooth"});
              }} style={{background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.08)",border:"1px solid rgba(201,168,76,0.1)",cursor:"pointer",transition:"transform 0.22s,box-shadow 0.22s"}}>
                <div style={{background:`linear-gradient(135deg,${["#1a3a6e","#0d3320","#100828","#2d1200","#1a0a50","#1a1000"][i%6]},#c9a84c)`,height:90,padding:"14px 16px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#fff",lineHeight:1}}>{p.dest}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>{p.state||p.country}</div>
                  </div>
                  <span style={{background:"rgba(255,255,255,0.18)",backdropFilter:"blur(4px)",padding:"3px 10px",borderRadius:20,fontSize:11,color:"#fff",fontWeight:500,border:"1px solid rgba(255,255,255,0.2)"}}>{p.tag}</span>
                </div>
                <div style={{padding:"14px 16px"}}>
                  <div style={{fontSize:13,color:"#555",lineHeight:1.6,marginBottom:10}}>{p.why}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:10,color:"#aaa",letterSpacing:"0.06em",marginBottom:2}}>BUDGET / PERSON</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16,color:GOLD_DARK}}>{p.budget}</div>
                    </div>
                    <button style={{padding:"7px 14px",background:GRAD,border:"none",borderRadius:9,fontSize:12,fontWeight:600,color:"#1a1410",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      Explore →
                    </button>
                  </div>
                  {p.from&&<div style={{fontSize:10,color:"#bbb",marginTop:8}}>Popular from {p.from}</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,fontSize:12,color:"#bbb",textAlign:"right",fontStyle:"italic"}}>
            * Budget ranges are approximate · Updated monthly · Click any destination to search hotels
          </div>
        </div>

        {/* TIPS */}
        <div style={{marginBottom:52}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:GOLD_DARK,letterSpacing:"0.2em",marginBottom:6}}>💡 SMART TRAVEL</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:"clamp(20px,3vw,32px)",color:"#1a1410",marginBottom:20}}>Tips to Save More</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
            {TIPS.map((t,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"20px 18px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid rgba(201,168,76,0.1)"}}>
                <div style={{fontSize:28,marginBottom:12}}>{t.icon}</div>
                <div style={{fontWeight:700,fontSize:15,color:"#1a1410",marginBottom:8}}>{t.title}</div>
                <div style={{fontSize:13,color:"#666",lineHeight:1.65}}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHY ALVRYN */}
        <div style={{background:"linear-gradient(135deg,#1a1205,#2d1e08)",borderRadius:24,padding:"40px 36px",marginBottom:32,boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:GOLD,letterSpacing:"0.22em",marginBottom:10}}>WHY ALVRYN</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(22px,3.5vw,40px)",color:"#fff",marginBottom:8}}>Travel smarter with AI</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",maxWidth:440,margin:"0 auto"}}>Alvryn combines intelligent search with AI trip planning — no other platform does both.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
            {[
              {icon:"🤖",title:"AI Trip Planner",desc:"Complete door-to-door plans in seconds."},
              {icon:"✈️",title:"60+ Destinations",desc:"Flights to major Indian & international cities."},
              {icon:"🛡️",title:"Safety Insights",desc:"Proactive safety info for every destination."},
              {icon:"💰",title:"Best Fares",desc:"No hidden fees, no markup from Alvryn."},
              {icon:"🚌",title:"300+ Bus Routes",desc:"AC sleeper buses across India via RedBus."},
              {icon:"🔒",title:"Secure Booking",desc:"All payments on official partner sites."},
            ].map((f,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",borderRadius:14,padding:"18px 16px",border:"1px solid rgba(201,168,76,0.18)"}}>
                <div style={{fontSize:26,marginBottom:10}}>{f.icon}</div>
                <div style={{fontWeight:600,fontSize:14,color:"#fff",marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:28}}>
            <button onClick={()=>navigate("/go/ai")} style={{padding:"14px 36px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"sc_gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.45)`}}>
              Try ALVI Free →
            </button>
          </div>
        </div>

        <div style={{textAlign:"center",fontSize:12,color:"#bbb",lineHeight:1.8}}>
          Alvryn is a travel discovery platform. We may earn a commission from partner links at no extra cost to you.<br/>
          Flights via Aviasales · Buses & Trains via RedBus · Hotels via Booking.com
        </div>
      </div>
    </div>
  );
}