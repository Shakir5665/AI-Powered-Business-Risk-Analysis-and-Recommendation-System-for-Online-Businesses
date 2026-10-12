import json
import os

positive_reviews = [
    # REV002 from prompt
    ("Excellent sound quality and reliable performance", {"quality": "positive", "delivery": "not_mentioned", "trust": "positive"}),
    ("The sound quality is excellent", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Crystal clear audio and the bass response is surprisingly deep.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Battery lasts over 6 hours on a single charge. Super impressed!", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Arrived two days ahead of schedule, beautifully packed.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Genuine product from an honest seller. Everything matches the description.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"}),
    ("Top notch audio clarity and fast dispatch by the merchant.", {"quality": "positive", "delivery": "positive", "trust": "not_mentioned"}),
    ("Comfortable fit for long gym sessions and sweat resistant.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Seller answered all my questions promptly and provided official warranty.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"}),
    ("Superb noise reduction and the silicone case included is really handy.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Lightning fast delivery and product arrived in pristine condition.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Amazing bluetooth range, works across two rooms without drops.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Authentic earbuds, verified serial number on the manufacturer portal.", {"quality": "positive", "delivery": "not_mentioned", "trust": "positive"}),
    ("Outstanding microphone pickup during office Zoom calls.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Great battery backup and super quick delivery service.", {"quality": "positive", "delivery": "positive", "trust": "not_mentioned"}),
    ("High quality finish, feels very premium in hand.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Trusted seller with authentic stock and clear communication.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"}),
    ("Crisp highs and warm mids. Audio profile is very well balanced.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Package was bubble-wrapped securely and arrived right on time.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Both earbuds connect instantaneously upon opening the charging case lid.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("The merchant honored the discount code and shipped within 24 hours.", {"quality": "not_mentioned", "delivery": "positive", "trust": "positive"}),
    ("Premium sound output, secure courier delivery, and 100% genuine item.", {"quality": "positive", "delivery": "positive", "trust": "positive"}),
    ("Ear tips fit snugly and provide decent passive noise isolation.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Very honest seller who proactively shared tracking details.", {"quality": "not_mentioned", "delivery": "positive", "trust": "positive"}),
    ("Impressive build quality with sturdy hinges on the magnetic case.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Super rapid shipping and the earbuds exceed expectations for the price.", {"quality": "positive", "delivery": "positive", "trust": "not_mentioned"}),
    ("Touch controls are very responsive and easy to customize.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Flawless experience from order placement to fast doorstep delivery.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Legit product with verified warranty card enclosed inside.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"}),
    ("The bass punch is energetic without overpowering vocal clarity.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Speedy shipping and the product matches the listing photos 100%.", {"quality": "not_mentioned", "delivery": "positive", "trust": "positive"}),
    ("Wireless charging works seamlessly and earbuds charge quickly.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Great build materials and reputable vendor who shipped immediately.", {"quality": "positive", "delivery": "positive", "trust": "positive"}),
    ("Voice calls are loud and clear even when walking outdoors in breeze.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivered safely within 48 hours without any damage to packaging.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Solid construction, fantastic soundstage, and legitimate seller.", {"quality": "positive", "delivery": "not_mentioned", "trust": "positive"}),
    ("Battery life easily meets the advertised specifications.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Prompt dispatch and polite courier driver.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Trustworthy seller with excellent packaging and pristine merchandise.", {"quality": "positive", "delivery": "positive", "trust": "positive"}),
    ("Compact charging case fits easily into coin pockets.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Verified authentic merchandise, definitely buying from this store again.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"}),
    ("Rich acoustic quality with punchy sub-bass frequencies.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Swift delivery and hassle-free ordering experience.", {"quality": "not_mentioned", "delivery": "positive", "trust": "not_mentioned"}),
    ("Low audio latency makes watching movies and gaming delightful.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Accurate listing details and transparent return policy from seller.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"}),
    ("Fast parcel dispatch and the product sounds remarkably clear.", {"quality": "positive", "delivery": "positive", "trust": "not_mentioned"}),
    ("Ergonomic contouring ensures earbuds never fall out during jogs.", {"quality": "positive", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Smooth delivery and seller included the advertised complimentary case.", {"quality": "not_mentioned", "delivery": "positive", "trust": "positive"}),
    ("Top-tier sound fidelity, premium packaging, and fast shipment.", {"quality": "positive", "delivery": "positive", "trust": "not_mentioned"}),
    ("Completely authentic unit with active manufacturer support.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "positive"})
]

negative_reviews = [
    # REV001 from prompt
    ("Very bad product and late delivery", {"quality": "negative", "delivery": "negative", "trust": "not_mentioned"}),
    ("Left earbud stopped charging after just three days of mild use.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivery was delayed by over two weeks with zero tracking updates.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Counterfeit item. The serial number fails verification on the official website.", {"quality": "negative", "delivery": "not_mentioned", "trust": "negative"}),
    ("Terrible audio quality with constant buzzing distortion at higher volumes.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Package arrived completely crushed and one earbud casing was cracked.", {"quality": "negative", "delivery": "negative", "trust": "not_mentioned"}),
    ("Seller refused to honor the warranty and stopped responding to messages.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Battery drains from 100% to zero in less than 40 minutes.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Courier threw the package over the gate during heavy rain.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Fake replica earbuds. Do not trust this seller's misleading claims.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Microphone sounds muffled and underwater, unusable for work calls.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Dispatched five days late and seller gave invalid courier tracking numbers.", {"quality": "not_mentioned", "delivery": "negative", "trust": "negative"}),
    ("Cheap plastic build and flimsy case lid broke off within a week.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Horrible static noise in both earbuds and delivery was delayed.", {"quality": "negative", "delivery": "negative", "trust": "not_mentioned"}),
    ("Seller advertised free silicone case but omitted it from the box.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Bluetooth disconnects every 2 minutes while my phone is in my pocket.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Arrived two weeks late and the package had clearly been tampered with.", {"quality": "not_mentioned", "delivery": "negative", "trust": "negative"}),
    ("Extremely uncomfortable shape, causes ear pain after ten minutes.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Misleading product title. This is not genuine JBL as claimed by seller.", {"quality": "negative", "delivery": "not_mentioned", "trust": "negative"}),
    ("Severe sound delay between video and audio playback.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Late delivery, damaged packaging, and awful sounding audio.", {"quality": "negative", "delivery": "negative", "trust": "not_mentioned"}),
    ("Seller rejected my return request despite providing unboxing evidence.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Right earbud is significantly quieter than the left one.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Courier delayed shipment repeatedly without notifying the buyer.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Dishonest seller sent an opened return unit instead of brand new.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Hinges on the charging case became loose after only two days.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Late arrival and the merchant was extremely rude when contacted.", {"quality": "not_mentioned", "delivery": "negative", "trust": "negative"}),
    ("Zero bass response, hollow sound reminiscent of cheap disposable earphones.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Box arrived torn open with missing replacement silicone tips.", {"quality": "negative", "delivery": "negative", "trust": "not_mentioned"}),
    ("Total scam, received an unbranded clone product in a generic white box.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Charging case gets dangerously hot when plugged into standard adapter.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Shipping took over 18 days for a local order.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Defective item and the store refuses to reply to replacement requests.", {"quality": "negative", "delivery": "not_mentioned", "trust": "negative"}),
    ("Volume is way too low even at maximum setting.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Courier delivered to the wrong address and box was water damaged.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Fraudulent advertising. Specs do not match the received product.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Touch controls are hypersensitive and trigger false accidental taps.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Unacceptable delivery delay accompanied by poor packaging protection.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Poor quality speakers, delayed shipping, and unresponsive seller.", {"quality": "negative", "delivery": "negative", "trust": "negative"}),
    ("Earbud casing cracked open when dropped from desk height.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Seller sent a refurbished product while charging full retail price.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Harsh screeching sound occurs whenever bluetooth pairs.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Late delivery and parcel was missing tracking for over 10 days.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Audio cuts in and out every few steps when phone is in handbag.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Customer support gave misleading excuses for delays and product defects.", {"quality": "negative", "delivery": "negative", "trust": "negative"}),
    ("Plastic edges have sharp burrs that scratch the ear canal.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivery courier left the package in plain view on street curb.", {"quality": "not_mentioned", "delivery": "negative", "trust": "not_mentioned"}),
    ("Seller promised an authentic invoice but failed to provide any receipt.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"}),
    ("Terrible battery performance and fragile hinge mechanism.", {"quality": "negative", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Fake warranty card with invalid phone numbers and contact emails.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "negative"})
]

neutral_reviews = [
    # REV003 from prompt
    ("The earbuds work as expected", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Decent audio for the price, nothing extraordinary but acceptable.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivery arrived on the estimated date. Standard standard packaging.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("The product matches description, although packaging was somewhat plain.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Sound is average with modest bass. Good enough for casual podcasts.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Shipping speed was normal, took about 4 days as stated at checkout.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Standard customer service response, answered questions without enthusiasm.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Battery lasts around 3.5 hours, which is typical for budget wireless earbuds.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivery took standard time and audio quality is okay for everyday commute.", {"quality": "neutral", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Seller provides what is shown, no extra bonuses or special packaging.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Build is made of plastic as expected, neither cheap nor premium feeling.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Courier followed instructions, parcel delivered safely within ordinary timeframe.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Item appears genuine, standard documentation included in the package.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Microphone works decently in quiet rooms, but picks up background noise outdoors.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Average sound quality, ordinary delivery speed, fair value for money.", {"quality": "neutral", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Merchant provided standard tracking and dispatched on the second business day.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "neutral"}),
    ("Comfort is acceptable for an hour, after which slight ear pressure is felt.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Standard cardboard shipping box with basic bubble wrap.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Verified product details match specifications without any notable extras.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Bluetooth range is around 5 to 6 meters before experiencing occasional lag.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Average shipping duration, standard sound quality, and expected vendor communication.", {"quality": "neutral", "delivery": "neutral", "trust": "neutral"}),
    ("Case magnet holds earbuds moderately well, neither too weak nor very strong.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Package arrived within expected date window with standard courier updates.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Seller delivered exactly what was ordered without surprises.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Touch controls work with a slight half-second delay.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Parcel took five working days to arrive, which is standard for ground shipping.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Volume levels are sufficient for indoor environments.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Basic packaging with regular shipping speed and functional earbuds.", {"quality": "neutral", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Seller answered inquiries after 24 hours, average support response time.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Treble is clear while bass is fairly neutral and flat.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivery on schedule, seller reliable, sound quality acceptable.", {"quality": "neutral", "delivery": "neutral", "trust": "neutral"}),
    ("Case charges fully in about two hours using included cable.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Standard postal transit time, package arrived intact.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Authenticity seems fine, typical retail unit packaging.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Latency is fine for YouTube videos, but noticeable in competitive gaming.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Transit took the full estimated delivery window.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Sound profile is balanced without boosted bass or sharp highs.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Standard store policy and receipt provided as requested.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Earbud fit is reasonable, three silicone ear tip sizes included.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Courier dropped package in mailbox on the scheduled delivery date.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Everything works as described in the item specifications.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "neutral"}),
    ("LED battery indicator works properly though light is rather dim.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Delivery took standard 4 business days with typical parcel tracking.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Call audio is audible in quiet rooms, moderate performance.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Seller followed standard guidelines, no issues with transaction.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"}),
    ("Earbuds connect fine with Android and iOS devices after standard pairing.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Package reached destination in ordinary condition without special padding.", {"quality": "not_mentioned", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Medium grade sound quality, meets expectations for entry level wireless buds.", {"quality": "neutral", "delivery": "not_mentioned", "trust": "not_mentioned"}),
    ("Standard dispatch time and reasonable product functionality.", {"quality": "neutral", "delivery": "neutral", "trust": "not_mentioned"}),
    ("Legitimate seller, product corresponds faithfully to specs.", {"quality": "not_mentioned", "delivery": "not_mentioned", "trust": "neutral"})
]

reviews = []
count = 1

# Add positive reviews
for comment, aspects in positive_reviews:
    reviews.append({
        "id": f"REV{count:03d}",
        "comment": comment,
        "predictions": {
            "sentiment": "positive",
            "aspects": aspects
        }
    })
    count += 1

# Add negative reviews
for comment, aspects in negative_reviews:
    reviews.append({
        "id": f"REV{count:03d}",
        "comment": comment,
        "predictions": {
            "sentiment": "negative",
            "aspects": aspects
        }
    })
    count += 1

# Add neutral reviews
for comment, aspects in neutral_reviews:
    reviews.append({
        "id": f"REV{count:03d}",
        "comment": comment,
        "predictions": {
            "sentiment": "neutral",
            "aspects": aspects
        }
    })
    count += 1

data = {"reviews": reviews}

# Save in frontend/src/data/user_reviews.json
os.makedirs("frontend/src/data", exist_ok=True)
with open("frontend/src/data/user_reviews.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Save in frontend/public/user_reviews.json
os.makedirs("frontend/public", exist_ok=True)
with open("frontend/public/user_reviews.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Save in root user_reviews.json
with open("user_reviews.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Generated {len(reviews)} reviews successfully.")
pos = sum(1 for r in reviews if r['predictions']['sentiment'] == 'positive')
neg = sum(1 for r in reviews if r['predictions']['sentiment'] == 'negative')
neu = sum(1 for r in reviews if r['predictions']['sentiment'] == 'neutral')
print(f"Positive: {pos}, Negative: {neg}, Neutral: {neu}")
