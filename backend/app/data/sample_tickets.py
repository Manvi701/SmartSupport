# Redesigned dataset of 40 tickets reflecting the rebranding, mixed languages, and spam indicators.
SAMPLE_TICKETS = [
    # 1. Refund - English
    {"text": "I want a refund for my order ORD-88127. The item was damaged upon arrival and I am extremely unsatisfied. Please send my $120.00 back immediately!"},
    # 2. Refund - Hindi
    {"text": "मेरा पैसा वापस करो! maine 5 din pehle return request dala tha but abhi tak koi refund nahi mila. order id ORD-77621. total 4500 rs ka loss hua hai. help me immediately!"},
    # 3. Refund - Gujarati
    {"text": "મને રિફંડ ક્યારે મળશે? ૧૦ દિવસ થઈ ગયા છે. મેં એક સાડી ખરીદી હતી જે ફાટેલી નીકળી. ઓર્ડર નંબર ORD-33928. મારા 2500 રૂપિયા પાછા જોઈએ છે!"},
    # 4. Payment Issue - Hinglish (Mixed Hindi-English)
    {"text": "Mera payment deduct ho gaya but refund nathi malyo. check karo status. email is rahul.sharma@gmail.com and phone is 9876543210. Rs. 1500 cut gaye."},
    # 5. Order Delay - Gujarati-English (Mixed Gujarati-English)
    {"text": "મારો ઓર્ડર ORD-55419 હજુ સુધી પહોંચ્યો નથી please help. delivery was scheduled yesterday. check status asap."},
    # 6. Order Delay - Mixed Hindi-Gujarati-English
    {"text": "Mera order delay kyun hai? delivery address ahmedabad. order id ord-88271. delay ho gaya chhe, please call me 9988776655. check asap."},
    # 7. Order Delay - English
    {"text": "My package with order id ORD-99823 hasn't arrived yet. The tracking shows it is in Mumbai for the last 4 days. Please expedite, I need it before Friday."},
    # 8. Login Issue - English (Locked out)
    {"text": "I am completely locked out of my account (john.doe@enterprise.com). The password reset page is throwing a 500 error. I need to access my dashboard urgent!"},
    # 9. Login Issue - Gujarati
    {"text": "હું મારા એકાઉન્ટમાં લોગીન નથી કરી શકતો, પાસવર્ડ રીસેટ પણ કામ નથી કરતો. કૃપા કરીને આ ટેક્નિકલ સમસ્યાને ઠીક કરો."},
    # 10. Security Issue - English (Unauthorized Login)
    {"text": "security alert: unauthorized login detected from unknown ip. I got a notification email but I was sleeping. My account might be hacked. Email: secure.user@yahoo.com"},
    # 11. Security Issue - Hindi
    {"text": "Mera account hack ho gaya hai shayad. kisi ne password badal diya hai aur support page open nahi ho raha. help me to lock it. phone: 8877665544"},
    # 12. Subscription Problem - English
    {"text": "I was charged $49.99 for a subscription renewal today, but I cancelled it last week. Please cancel this charge and return the money to my card."},
    # 13. Cancellation - English
    {"text": "cancellation request for order ord-99823. amount was 5000 rs. I changed my mind, do not ship it. Email: cancel.me@test.com"},
    # 14. Cancellation - Hindi
    {"text": "mujhe apna premium plan cancel karna hai. koi extra fees to nahi lagegi na? please process subscription cancellation ASAP. username: amit99"},
    # 15. Complaint - English
    {"text": "This is the worst customer service ever! The app crashes every time I open the cart. I hate this useless service, fix this ridiculous application immediately!"},
    
    # --- SPAM INCIDENTS ---
    # 16. Spam - Repeated words
    {"text": "BUY NOW BUY NOW BUY NOW BUY NOW BUY NOW promotional discount deal click link immediately buy now promo code free voucher!"},
    # 17. Spam - Random characters
    {"text": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa gibberish content text"},
    # 18. Spam - Emojis
    {"text": "🔥🔥🔥 CLICK HERE 🔥🔥🔥 GET FREE CASH PRIZE NOW 🔥🔥🔥 AMAZING VOUCHERS NOW CLICK HERE 🔥🔥🔥"},
    # 19. Spam - Promotional
    {"text": "Earn $5000 a day working from home! No experience required. Visit our site to claim your free lottery voucher now. Click here congratulations win cash!"},
    # 20. Spam - Gibberish random sequences
    {"text": "qwertyuiopasdfghjklzxcvbnm qpwoeirutyalskdjfhgzmxncbv1234567890 gibberish test message"},
    
    # --- DUPLICATE TICKETS ---
    # 21. Duplicate 1 - Original
    {"text": "Duplicate ticket test: I cannot login to my account using email duplicate.test@enterprise.com. The page is showing a blank screen. Please assist."},
    # 22. Duplicate 2 - Identical duplicate
    {"text": "Duplicate ticket test: I cannot login to my account using email duplicate.test@enterprise.com. The page is showing a blank screen. Please assist."},
    # 23. Duplicate 3 - Semantic duplicate
    {"text": "I can't login to my account with duplicate.test@enterprise.com. The page is showing a blank screen. Please help duplicate test!"},
    
    # 24. Out Of Scope - English
    {"text": "Can you recommend a good restaurant near corporate offices in Mumbai? Also, what is the weather like today in Ahmedabad?"},
    # 25. Out Of Scope - Hindi
    {"text": "mumbai me aaj barish hogi kya? aur sabse acchi film konsi chal rahi hai abhi cinema me?"},
    # 26. Out Of Scope - Gujarati
    {"text": "આજે અમદાવાદમાં સોનાનો ભાવ શું છે? અને કઈ હોટલ ટેસ્ટી ભોજન માટે સારી છે?"},
    
    # 27. Empty message
    {"text": ""},
    # 28. Whitespace message
    {"text": "   \n   \t   "},
    
    # 29. Technical Bug - English
    {"text": "API request failing with status code 403 when trying to fetch user logs. Here is the endpoint: /api/v1/logs. This is blocking our integration team."},
    # 30. Technical Bug - Mixed Hindi-English
    {"text": "App crash ho jata hai jab photo upload karte hain. Error console: OutOfMemoryError in upload_task.py. Please fix this bug."},
    # 31. Technical Bug - Gujarati
    {"text": "જ્યારે હું પેમેન્ટ પેજ ખોલું છું ત્યારે સ્ક્રીન વ્હાઇટ થઇ જાય છે અને બ્રાઉઝર હેંગ થઇ જાય છે. આ એરર સોલ્વ કરો."},
    # 32. Account Issue - English
    {"text": "Please delete my account and purge all my personal data from your databases. I am moving to another service. My email is delete.user@domain.com"},
    # 33. Account Issue - Mixed Hindi-English
    {"text": "Mera register email change karna hai. Purana email amit.sen@gmail.com tha, naya email amit.s@enterprise.com kar dijiye. Thank you."},
    # 34. Account Issue - Gujarati
    {"text": "મારા પ્રોફાઇલ પિક્ચર અપલોડ કરવામાં પ્રોબ્લેમ આવે છે. સાઈઝ ૧ MB થી ઓછી છે છતાં અપલોડ નથી થતી. પ્રોફાઇલ સેટિંગ ચેક કરો."},
    # 35. Payment Issue - English (Double charge)
    {"text": "Double charge issue! I was billed twice for order ORD-12093. Charges are $89.00 and $89.00 on my credit card. Refund the duplicate charge."},
    # 36. Payment Issue - Gujarati
    {"text": "મારી ક્રેડિટ કાર્ડથી ચુકવણી નિષ્ફળ ગઈ પણ બેંક માંથી મેસેજ આવ્યો કે પૈસા કપાઈ ગયા છે. રૂ. ૪૫૦૦ ની રકમ હતી. આ ટ્રાન્ઝેક્શન ચેક કરો."},
    # 37. Order Delay - English
    {"text": "Where is my shipment? Order ORD-44512 was placed 7 days ago. The delivery estimated was 3 days. There is no update on the tracking link."},
    # 38. Login Issue - Hindi
    {"text": "Mera password reset link email par nahi aa raha hai. OTP option try kiya par phone par code bhi nahi aaya. Mobile: 9898989898"},
    # 39. Security Issue - English
    {"text": "URGENT: I detected a SQL injection attempt in our client portal input logs. Someone is trying to exploit the search query box. IP: 192.168.1.100. Contact security admin."},
    # 40. Feature Request - English
    {"text": "It would be great if you could add a dark mode toggle to the dashboard, and support exporting analysis charts in PDF format. Keep up the good work!"}
]
