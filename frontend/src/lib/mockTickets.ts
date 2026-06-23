import { Ticket } from "./types";

export const SAMPLE_TICKETS = [
    // 1. Refund - English
    "I want a refund for my order ORD-88127. The item was damaged upon arrival and I am extremely unsatisfied. Please send my $120.00 back immediately!",
    // 2. Refund - Hindi
    "मेरा पैसा वापस करो! maine 5 din pehle return request dala tha but abhi tak koi refund nahi mila. order id ORD-77621. total 4500 rs ka loss hua hai. help me immediately!",
    // 3. Refund - Gujarati
    "મને રિફંડ ક્યારે મળશે? ૧૦ દિવસ થઈ ગયા છે. મેં એક સાડી ખરીદી હતી જે ફાટેલી નીકળી. ઓર્ડર નંબર ORD-33928. મારા 2500 રૂપિયા પાછા જોઈએ છે!",
    // 4. Payment Issue - Hinglish (Mixed Hindi-English)
    "Mera payment deduct ho gaya but refund nathi malyo. check karo status. email is rahul.sharma@gmail.com and phone is 9876543210. Rs. 1500 cut gaye.",
    // 5. Order Delay - Gujarati-English (Mixed Gujarati-English)
    "મારો ઓર્ડર ORD-55419 હજુ સુધી પહોંચ્યો નથી please help. delivery was scheduled yesterday. check status asap.",
    // 6. Order Delay - Mixed Hindi-Gujarati-English
    "Mera order delay kyun hai? delivery address ahmedabad. order id ord-88271. delay ho gaya chhe, please call me 9988776655. check asap.",
    // 7. Order Delay - English
    "My package with order id ORD-99823 hasn't arrived yet. The tracking shows it is in Mumbai for the last 4 days. Please expedite, I need it before Friday.",
    // 8. Login Issue - English (Locked out)
    "I am completely locked out of my account (john.doe@enterprise.com). The password reset page is throwing a 500 error. I need to access my dashboard urgent!",
    // 9. Login Issue - Gujarati
    "હું મારા એકાઉન્ટમાં લોગીન નથી કરી શકતો, પાસવર્ડ રીસેટ પણ કામ નથી કરતો. કૃપા કરીને આ ટેક્નિકલ સમસ્યાને ઠીક કરો.",
    // 10. Security Issue - English (Unauthorized Login)
    "security alert: unauthorized login detected from unknown ip. I got a notification email but I was sleeping. My account might be hacked. Email: secure.user@yahoo.com",
    // 11. Security Issue - Hindi
    "Mera account hack ho gaya hai shayad. kisi ne password badal diya hai aur support page open nahi ho raha. help me to lock it. phone: 8877665544",
    // 12. Subscription Problem - English
    "I was charged $49.99 for a subscription renewal today, but I cancelled it last week. Please cancel this charge and return the money to my card.",
    // 13. Cancellation - English
    "cancellation request for order ord-99823. amount was 5000 rs. I changed my mind, do not ship it. Email: cancel.me@test.com",
    // 14. Cancellation - Hindi
    "mujhe apna premium plan cancel karna hai. koi extra fees to nahi lagegi na? please process subscription cancellation ASAP. username: amit99",
    // 15. Complaint - English
    "This is the worst customer service ever! The app crashes every time I open the cart. I hate this useless service, fix this ridiculous application immediately!",
    // 16. Spam - Repeated words
    "BUY NOW BUY NOW BUY NOW BUY NOW BUY NOW promotional discount deal click link immediately buy now promo code free voucher!",
    // 17. Spam - Random characters
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa gibberish content text",
    // 18. Spam - Emojis
    "🔥🔥🔥 CLICK HERE 🔥🔥🔥 GET FREE CASH PRIZE NOW 🔥🔥🔥 AMAZING VOUCHERS NOW CLICK HERE 🔥🔥🔥",
    // 19. Spam - Promotional
    "Earn $5000 a day working from home! No experience required. Visit our site to claim your free lottery voucher now. Click here congratulations win cash!",
    // 20. Spam - Gibberish random sequences
    "qwertyuiopasdfghjklzxcvbnm qpwoeirutyalskdjfhgzmxncbv1234567890 gibberish test message",
    // 21. Duplicate 1 - Original
    "Duplicate ticket test: I cannot login to my account using email duplicate.test@enterprise.com. The page is showing a blank screen. Please assist.",
    // 22. Duplicate 2 - Identical duplicate
    "Duplicate ticket test: I cannot login to my account using email duplicate.test@enterprise.com. The page is showing a blank screen. Please assist.",
    // 23. Duplicate 3 - Semantic duplicate
    "I can't login to my account with duplicate.test@enterprise.com. The page is showing a blank screen. Please help duplicate test!",
    // 24. Out Of Scope - English
    "Can you recommend a good restaurant near corporate offices in Mumbai? Also, what is the weather like today in Ahmedabad?",
    // 25. Out Of Scope - Hindi
    "mumbai me aaj barish hogi kya? aur sabse acchi film konsi chal rahi hai abhi cinema me?",
    // 26. Out Of Scope - Gujarati
    "આજે અમદાવાદમાં સોનાનો ભાવ શું છે? અને કઈ હોટલ ટેસ્ટી ભોજન માટે સારી છે?",
    // 27. Empty message
    "",
    // 28. Whitespace message
    "   \n   \t   ",
    // 29. Technical Bug - English
    "API request failing with status code 403 when trying to fetch user logs. Here is the endpoint: /api/v1/logs. This is blocking our integration team.",
    // 30. Technical Bug - Mixed Hindi-English
    "App crash ho jata hai jab photo upload karte hain. Error console: OutOfMemoryError in upload_task.py. Please fix this bug.",
    // 31. Technical Bug - Gujarati
    "જ્યારે હું પેમેન્ટ પેજ ખોલું છું ત્યારે સ્ક્રીન વ્હાઇટ થઇ જાય છે અને બ્રાઉઝર હેંગ થઇ જાય છે. આ એરર સોલ્વ કરો.",
    // 32. Account Issue - English
    "Please delete my account and purge all my personal data from your databases. I am moving to another service. My email is delete.user@domain.com",
    // 33. Account Issue - Mixed Hindi-English
    "Mera register email change karna hai. Purana email amit.sen@gmail.com tha, naya email amit.s@enterprise.com kar dijiye. Thank you.",
    // 34. Account Issue - Gujarati
    "મારા પ્રોફાઇલ પિક્ચર અપલોડ કરવામાં પ્રોબ્લેમ આવે છે. સાઈઝ ૧ MB થી ઓછી છે છતાં અપલોડ નથી થતી. પ્રોફાઇલ સેટિંગ ચેક કરો.",
    // 35. Payment Issue - English (Double charge)
    "Double charge issue! I was billed twice for order ORD-12093. Charges are $89.00 and $89.00 on my credit card. Refund the duplicate charge.",
    // 36. Payment Issue - Gujarati
    "મારી ક્રેડિટ કાર્ડથી ચુકવણી નિષ્ફળ ગઈ પણ બેંક માંથી મેસેજ આવ્યો કે પૈસા કપાઈ ગયા છે. રૂ. ૪૫૦ઓ ની રકમ હતી. આ ટ્રાન્ઝેક્શન ચેક કરો.",
    // 37. Order Delay - English
    "Where is my shipment? Order ORD-44512 was placed 7 days ago. The delivery estimated was 3 days. There is no update on the tracking link.",
    // 38. Login Issue - Hindi
    "Mera password reset link email par nahi aa raha hai. OTP option try kiya par phone par code bhi nahi aaya. Mobile: 9898989898",
    // 39. Security Issue - English
    "URGENT: I detected a SQL injection attempt in our client portal input logs. Someone is trying to exploit the search query box. IP: 192.168.1.100. Contact security admin.",
    // 40. Feature Request - English
    "It would be great if you could add a dark mode toggle to the dashboard, and support exporting analysis charts in PDF format. Keep up the good work!"
];

export function generateMockTicket(text: string, index: number): Ticket {
  let language = "English";
  let translated_text = text;
  if (/[\u0900-\u097F]/.test(text)) {
    language = "Hindi";
    translated_text = "[Translated from Hindi]: " + text;
  } else if (/[\u0A80-\u0AFF]/.test(text)) {
    language = "Gujarati";
    translated_text = "[Translated from Gujarati]: " + text;
  }
  
  const textLower = text.toLowerCase();
  if (textLower.includes("deduct ho gaya") || textLower.includes("delay kyun hai")) {
    language = "Mixed Hindi-Gujarati-English";
    translated_text = "[Translated from Mixed Hindi-Gujarati-English]: " + text;
  }
  
  let intent = "Complaint";
  let department = "Operations Team";
  if (textLower.includes("refund") || textLower.includes("वापस") || textLower.includes("રિફંડ")) {
    intent = "Refund Request";
    department = "Finance";
  } else if (textLower.includes("payment") || textLower.includes("charge") || textLower.includes("billed") || textLower.includes("ચુકવણી")) {
    intent = "Payment Issue";
    department = "Finance";
  } else if (textLower.includes("delay") || textLower.includes("shipping") || textLower.includes("delivery") || textLower.includes("હજુ સુધી")) {
    intent = "Order Delay";
    department = "Logistics";
  } else if (textLower.includes("login") || textLower.includes("password") || textLower.includes("લોગીન") || textLower.includes("લોગિન")) {
    intent = "Login Issue";
    department = "Technical Support";
  } else if (textLower.includes("hack") || textLower.includes("unauthorized") || textLower.includes("sql injection") || textLower.includes("security")) {
    intent = "Security Issue";
    department = "Security Team";
  } else if (textLower.includes("cancel") || textLower.includes("cancellation")) {
    intent = "Cancellation";
    department = "Customer Success";
  } else if (textLower.includes("bug") || textLower.includes("crash") || textLower.includes("error")) {
    intent = "Technical Bug";
    department = "Technical Support";
  } else if (textLower.includes("feature") || textLower.includes("suggest") || textLower.includes("improve")) {
    intent = "Feature Request";
    department = "Operations Team";
  } else if (textLower.includes("voucher") || textLower.includes("free") || textLower.includes("win") || textLower.includes("aaaaa")) {
    intent = "Spam";
    department = "Operations Team";
  } else if (textLower.includes("restaurant") || textLower.includes("weather") || textLower.includes("barish")) {
    intent = "Out Of Scope";
    department = "Operations Team";
  }

  const isSpam = intent === "Spam" || textLower.includes("buy now") || textLower.includes("gibberish") || textLower.includes("click here");
  
  let sentiment = "Neutral";
  if (textLower.includes("worst") || textLower.includes("useless") || textLower.includes("frustrated") || textLower.includes("damaged")) {
    sentiment = "Negative";
  } else if (textLower.includes("thanks") || textLower.includes("great") || textLower.includes("excellent")) {
    sentiment = "Positive";
  }

  let priority = "Medium";
  if (intent === "Security Issue" || textLower.includes("sql injection") || textLower.includes("hack")) {
    priority = "Critical";
  } else if (intent === "Payment Issue" || intent === "Cancellation" || sentiment === "Negative") {
    priority = "High";
  } else if (isSpam || intent === "Out Of Scope") {
    priority = "Low";
  }
  
  const sla_hours = priority === "Critical" ? 1 : priority === "High" ? 4 : priority === "Medium" ? 8 : 24;

  // Human Intervention
  const isHuman = intent === "Security Issue" || intent === "Cancellation" || priority === "Critical" || textLower.includes("hack") || textLower.includes("unauthorized") || textLower.includes("sql injection");
  const human_intervention = isHuman ? "Human Required" : "Can Be Resolved Online";
  const human_intervention_reason = isHuman 
    ? "High severity escalation or critical transaction barrier requiring supervisor review."
    : "Routine query. Standard resolution steps apply.";

  const orderMatch = text.match(/ORD-\d+/i);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/\d{10}/);
  const amountMatch = text.match(/\$\d+(?:\.\d{2})?/) || text.match(/\b\d+\s*(?:rs|rupees)/i);

  const formattedDate = new Date(Date.now() - index * 3600000).toISOString();

  return {
    id: index + 1,
    ticket_id: `TKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${10000 + index}`,
    raw_text: text,
    summary: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
    language,
    translated_text,
    cleaned_text: text,
    intent,
    sentiment,
    priority,
    department,
    sla_hours,
    confidence_score: 0.92,
    human_review_required: isHuman || sentiment === "Negative",
    out_of_scope: intent === "Out Of Scope",
    duplicate_ticket: index === 21 || index === 22,
    duplicate_ticket_id: index === 21 || index === 22 ? `TKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-10020` : null,
    matched_ticket_id: index === 21 || index === 22 ? `TKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-10020` : null,
    spam: isSpam,
    spam_score: isSpam ? 0.95 : 0.05,
    spam_reason: isSpam ? "Junk or repeated words." : null,
    retries_count: 0,
    reason: `Automated rule classification. Routed to ${department}.`,
    human_intervention,
    human_intervention_reason,
    entities: {
      order_id: orderMatch ? orderMatch[0].toUpperCase() : "",
      amount: amountMatch ? amountMatch[0] : "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : ""
    },
    status: "Open",
    created_at: formattedDate,
    timeline_data: {
      "Validation": { "duration_ms": 0.1, "status": "Valid" },
      "Triage Process": { "duration_ms": 1.2, "result": "Success" },
      "total_duration_ms": 1.3
    }
  };
}

export function getLocalMockTickets(): Ticket[] {
    return SAMPLE_TICKETS.map((text, idx) => generateMockTicket(text, idx));
}
