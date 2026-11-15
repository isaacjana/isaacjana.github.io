// All static content: stages, checklists, schedules and guides.
// Written for families in Sarawak. General information only — the clinic's advice always comes first.

export const STAGES = {
    plan: { name: "Planning", bm: "Merancang", icon: "🌱", blurb: "Family planning, getting ready, or trying for a baby" },
    preg: { name: "Pregnant", bm: "Hamil", icon: "🤰", blurb: "Week-by-week care until the birth" },
    post: { name: "Baby is here", bm: "Selepas bersalin", icon: "👶", blurb: "Newborn care, recovery and paperwork" }
};

export const DIVISIONS = {
    "Kuching": "Sarawak General Hospital, Kuching",
    "Samarahan": "Sarawak General Hospital, Kuching",
    "Serian": "Sarawak General Hospital, Kuching",
    "Sri Aman": "Hospital Sri Aman (complex cases go to Sarawak General Hospital)",
    "Betong": "Hospital Sri Aman or Sarawak General Hospital",
    "Sarikei": "Hospital Sarikei (complex cases go to Hospital Sibu)",
    "Sibu": "Hospital Sibu",
    "Kapit": "Hospital Kapit (complex cases go to Hospital Sibu)",
    "Mukah": "Hospital Sibu",
    "Bintulu": "Hospital Bintulu",
    "Miri": "Hospital Miri",
    "Limbang": "Hospital Limbang (complex cases go to Hospital Miri)"
};

export const HELPLINES = [
    { label: "Emergency / ambulance", tel: "999", note: "Any time" },
    { label: "Talian HEAL (KKM mental health)", tel: "15555", note: "Daily, 8am to midnight" },
    { label: "Befrienders Kuching", tel: "082242800", show: "082-242800", note: "Daily, 6.30pm to 9.30pm" },
    { label: "Talian Kasih (welfare, abuse)", tel: "15999", note: "24 hours" }
];

// ---------- Checklists ----------

export const PLAN_TASKS = [
    { id: "pc.folic", t: "Start folic acid every day", d: "400 mcg daily, from at least 1 month (ideally 3) before trying until week 12. Ask about the 5 mg dose if you have diabetes, epilepsy, a BMI of 30+, or a previous baby with a spine or brain defect." },
    { id: "pc.clinic", t: "Pre-pregnancy check-up at Klinik Kesihatan", d: "Ask for 'pemeriksaan pra-kehamilan'. Go as a couple if you can.", g: "plan-precare" },
    { id: "pc.chronic", t: "Review long-term conditions and medicines", d: "Diabetes, high blood pressure, thyroid, epilepsy, asthma: get them reviewed before you stop contraception. Never stop medicine on your own." },
    { id: "pc.bloods", t: "Blood tests and thalassaemia screening", d: "Haemoglobin, blood group, thalassaemia, hepatitis B, HIV, syphilis and rubella immunity." },
    { id: "pc.vax", t: "Vaccinations up to date", d: "Rubella (MMR) and hepatitis B. Wait 1 month after an MMR jab before trying." },
    { id: "pc.cycle", t: "Track your cycle for 2 to 3 months", d: "Log each period in the Track tab so the app can estimate your fertile days." },
    { id: "pc.habits", t: "Stop smoking, vaping and alcohol (both of you)", d: "This includes tuak and langkau. Both affect egg and sperm quality." },
    { id: "pc.weight", t: "Work towards a healthy weight", d: "Being very under- or overweight can stop ovulation. Even 5 to 10% weight loss can bring periods back." },
    { id: "pc.dental", t: "Dental check-up", d: "Gum disease is linked to early birth. Easier to treat before pregnancy." },
    { id: "pc.work", t: "Check for hazards at work", d: "Pesticides on farms and plantations, solvents, heavy lifting, long shifts. Ask your employer about safer duties." },
    { id: "pc.money", t: "Sort out money and cover", d: "Check insurance waiting periods for maternity cover, employer benefits, and start a small birth fund." }
];

// w: [fromWeek, toWeek] when the task is most relevant
export const PREG_TASKS = [
    { id: "pg.book", tri: 1, w: [4, 12], t: "Register at Klinik Kesihatan and get your Buku Pink", d: "Book before 12 weeks. Bring both MyKads and your marriage certificate if you have one.", g: "preg-pink" },
    { id: "pg.folic", tri: 1, w: [4, 12], t: "Folic acid daily until week 12", d: "Then take the iron and other supplements your clinic gives you." },
    { id: "pg.bloods", tri: 1, w: [6, 13], t: "Booking blood and urine tests", d: "Haemoglobin, blood group, sugar, HIV, hepatitis B and syphilis screening." },
    { id: "pg.dating", tri: 1, w: [7, 13], t: "Dating scan", d: "Confirms your due date. Update it in the Me tab if the clinic changes it." },
    { id: "pg.leave", tri: 1, w: [10, 16], t: "Tell your employer and check maternity leave", d: "98 days of paid maternity leave under the Sarawak Labour Ordinance.", g: "preg-work" },
    { id: "pg.detail", tri: 2, w: [18, 22], t: "Detailed scan (18 to 22 weeks)", d: "Checks baby's organs and the position of the placenta." },
    { id: "pg.mgtt", tri: 2, w: [24, 28], t: "Sugar test (MGTT)", d: "Done at 24 to 28 weeks, or earlier if you are at higher risk. Fast overnight as instructed." },
    { id: "pg.tetanus", tri: 2, w: [16, 30], t: "Tetanus injections as scheduled", d: "The nurse will write the dates in your Buku Pink." },
    { id: "pg.where", tri: 2, w: [20, 30], t: "Decide where you will give birth", d: "If you live far from a hospital, plan transport now and ask your clinic about staying nearby before your due date.", g: "preg-where" },
    { id: "pg.confine", tri: 2, w: [20, 32], t: "Arrange confinement help", d: "Family, a confinement lady or tukang urut. Good ones are booked months ahead.", g: "post-pantang" },
    { id: "pg.gear", tri: 2, w: [24, 34], t: "Buy baby essentials", d: "Clothes, diapers, a safe place to sleep, and a car seat if you travel by car." },
    { id: "pg.kicks", tri: 3, w: [28, 42], t: "Start counting kicks every day", d: "From 28 weeks. Use the kick counter in the Track tab.", g: "preg-kicks" },
    { id: "pg.visits", tri: 3, w: [28, 42], t: "Keep to the closer clinic visits", d: "Usually every 2 weeks from 28 weeks and weekly from 36 weeks." },
    { id: "pg.signs", tri: 3, w: [30, 36], t: "Learn the signs of labour and the warning signs", g: "preg-labour" },
    { id: "pg.docs", tri: 3, w: [32, 38], t: "Get documents ready", d: "MyKads, marriage certificate and Buku Pink. You will need them for the birth certificate, EFS and BIB.", g: "post-admin" },
    { id: "pg.plan", tri: 3, w: [32, 37], t: "Make a birth-day plan", d: "Who drives, who stays with older children, emergency numbers saved, fuel in the tank." },
    { id: "pg.bag", tri: 3, w: [32, 36], t: "Pack your hospital bag by week 36", d: "Tick items off in Track › Bag." },
    { id: "pg.fp", tri: 3, w: [34, 42], t: "Talk about contraception after birth", d: "You can become pregnant again before your first period returns.", g: "post-fp" }
];

// by: days after birth by which this should be done
export const POST_TASKS = [
    { id: "pp.screen", by: 3, t: "Newborn checks before going home", d: "BCG and hepatitis B given, G6PD result written in the record book, baby examined by a doctor." },
    { id: "pp.jaundice", by: 7, t: "Watch for jaundice every day in week one", d: "Check skin and eyes in daylight and keep every clinic or nurse visit.", g: "post-firstweek" },
    { id: "pp.register", hard: 1, by: 14, t: "Register the birth at JPN", d: "Best within 14 days. Days 15 to 42 count as delayed, after 42 days as late registration with more paperwork.", g: "post-admin" },
    { id: "pp.efs", hard: 1, by: 365, t: "Apply for Endowment Fund Sarawak (RM1,000)", d: "At the JPN counter when you register the birth, or through iSarawakCare, within 12 months.", g: "post-admin" },
    { id: "pp.bib", hard: 1, by: 60, t: "Apply for Bantuan Ibu Bersalin (RM450)", d: "Through iSarawakCare. Apply early and check the portal for the current deadline.", g: "post-admin" },
    { id: "pp.insure", by: 30, t: "Add baby to insurance and tell your employer" },
    { id: "pp.mood", by: 30, t: "Do a mood check-in", d: "Use Track › Mama. Low mood after birth is common and treatable.", g: "post-mood" },
    { id: "pp.postnatal", hard: 1, by: 42, t: "Mama's postnatal check at about 1 month", d: "Blood pressure, wound, bleeding, breastfeeding and mood are reviewed." },
    { id: "pp.fp", by: 42, t: "Choose a contraception method", d: "Fertility can return 3 weeks after birth if you are not fully breastfeeding.", g: "post-fp" },
    { id: "pp.work", by: 80, t: "Plan your return to work", d: "Confirm your date (98 days of leave) and how you will feed or pump.", g: "preg-work" }
];

export const BAG = [
    { id: "bag.b1", c: "Documents", t: "MyKad (both parents)", must: 1 },
    { id: "bag.b2", c: "Documents", t: "Buku Pink", must: 1 },
    { id: "bag.b3", c: "Documents", t: "Marriage certificate (copy)" },
    { id: "bag.b4", c: "Documents", t: "Guarantee letter or insurance card" },
    { id: "bag.b5", c: "Mama", t: "Kain batik or sarong × 3", must: 1 },
    { id: "bag.b6", c: "Mama", t: "Maternity pads", must: 1 },
    { id: "bag.b7", c: "Mama", t: "Nursing bras and front-opening tops" },
    { id: "bag.b8", c: "Mama", t: "Toiletries and towel" },
    { id: "bag.b10", c: "Mama", t: "Socks, sweater and slippers", must: 1 },
    { id: "bag.b14", c: "Baby", t: "Newborn diapers", must: 1 },
    { id: "bag.b15", c: "Baby", t: "Baby clothes × 3 sets, mittens, booties", must: 1 },
    { id: "bag.b16", c: "Baby", t: "Swaddle or blanket", must: 1 },
    { id: "bag.b17", c: "Baby", t: "Wet wipes or cotton wool" },
    { id: "bag.b18", c: "Baby", t: "Car seat for the trip home" },
    { id: "bag.b20", c: "Partner", t: "Phone charger and powerbank", must: 1 },
    { id: "bag.b22", c: "Partner", t: "Snacks and drinking water" },
    { id: "bag.b23", c: "Partner", t: "Cash and small change" }
];

// Malaysia National Immunisation Programme; JE is given in Sarawak only.
export const VACCINES = [
    { id: "vax.birth", m: 0, t: "BCG + Hepatitis B", d: "Given at the hospital" },
    { id: "vax.hex1", m: 2, t: "6-in-1, dose 1", d: "Diphtheria, tetanus, pertussis, polio, Hib, hepatitis B" },
    { id: "vax.hex2", m: 3, t: "6-in-1, dose 2" },
    { id: "vax.pcv1", m: 4, t: "Pneumococcal (PCV), dose 1" },
    { id: "vax.hex3", m: 5, t: "6-in-1, dose 3" },
    { id: "vax.pcv2", m: 6, t: "Pneumococcal (PCV), dose 2" },
    { id: "vax.mmr1", m: 9, t: "MMR, dose 1" },
    { id: "vax.je1", m: 9, t: "Japanese encephalitis, dose 1", swk: 1 },
    { id: "vax.mmr2", m: 12, t: "MMR, dose 2" },
    { id: "vax.pcv3", m: 15, t: "Pneumococcal (PCV), booster" },
    { id: "vax.hex4", m: 18, t: "6-in-1, booster" },
    { id: "vax.je2", m: 21, t: "Japanese encephalitis, dose 2", swk: 1 }
];

export const MILESTONES = [
    { id: "ms.smile", m: 2, t: "Smiles back at you" },
    { id: "ms.head", m: 4, t: "Holds head steady" },
    { id: "ms.roll", m: 5, t: "Rolls over" },
    { id: "ms.solids", m: 6, t: "Starts solid food" },
    { id: "ms.sit", m: 8, t: "Sits without support" },
    { id: "ms.crawl", m: 9, t: "Crawls or shuffles" },
    { id: "ms.babble", m: 10, t: "Babbles 'mama', 'baba'" },
    { id: "ms.stand", m: 11, t: "Pulls up to stand" },
    { id: "ms.walk", m: 14, t: "First steps" }
];

// Size comparisons using things from a Sarawak market
export const SIZES = [
    [4, "a sesame seed"], [6, "a Sarawak peppercorn"], [8, "a kacang tanah"], [10, "a buah dabai"],
    [12, "a limau kasturi"], [16, "a terung asam"], [20, "a pisang"], [24, "an ear of jagung"],
    [28, "a terung panjang"], [32, "a young coconut"], [36, "a Sarawak pineapple"], [39, "a small durian"]
];

export const WEEK_NOTES = [
    [0, "Very early days. Keep taking folic acid and avoid alcohol, smoking and raw food."],
    [5, "Book your first visit at Klinik Kesihatan to get your Buku Pink. Nausea and tiredness are common now."],
    [9, "Booking bloods and a dating scan happen around now. Small, frequent meals help with nausea."],
    [13, "Second trimester. Energy usually returns. A good time for a dental check."],
    [18, "Detailed scan is due between 18 and 22 weeks. You may feel the first flutters."],
    [23, "Sugar test (MGTT) is done at 24 to 28 weeks. Start arranging confinement help."],
    [28, "Third trimester. Count kicks every day from now and keep to your fortnightly visits."],
    [32, "Pack your hospital bag and get documents ready. Plan how you will get to hospital."],
    [36, "Weekly visits from now. Baby could arrive any time after 37 weeks. Keep your phone charged."],
    [40, "Past your due date? Your clinic will see you more often. Keep counting kicks and do not wait if movements slow down."]
];

// ---------- Guides ----------
// Blocks: ["h", text] ["p", text] ["ul", [..]] ["ol", [..]] ["warn", text] ["tip", text] ["calls"]

export const GUIDES = [
    // ----- Planning -----
    {
        id: "plan-precare", stage: "plan", sec: "Getting ready", icon: "🩺", title: "Getting ready for pregnancy",
        sum: "What a pre-pregnancy check covers and where to get one in Sarawak.",
        body: [
            ["p", "The three months before you conceive matter as much as the pregnancy itself. A pre-pregnancy check finds problems while they are still easy to fix."],
            ["h", "Where to go"],
            ["ul", [
                "Your nearest Klinik Kesihatan or Klinik Kesihatan Ibu dan Anak. Ask for pre-pregnancy care (pra-kehamilan). Fees are minimal for Malaysians.",
                "Sarawak Family Planning Association (SFPA) clinics in Kuching and other main towns, and LPPKN in Kuching.",
                "Any private GP or O&G specialist.",
                "In the interior, start with your Klinik Desa or the visiting mobile or flying doctor team. They can refer you on."
            ]],
            ["h", "What the visit covers"],
            ["ul", [
                "Weight, blood pressure, and a review of your periods and past pregnancies.",
                "Blood tests: haemoglobin, blood group, thalassaemia screening, hepatitis B, HIV, syphilis, and rubella immunity.",
                "A review of any long-term illness and medicines so they are safe for pregnancy.",
                "Folic acid, and advice on weight, food, smoking and alcohol."
            ]],
            ["tip", "Thalassaemia carriers are common in Malaysia and usually feel perfectly well. If both of you are carriers, each pregnancy has a 1 in 4 chance of a seriously affected baby, so test before you conceive."],
            ["h", "See a doctor first if you have"],
            ["ul", ["Diabetes, high blood pressure, heart, kidney or thyroid disease, epilepsy or lupus", "A previous caesarean, stillbirth, very early birth or three or more miscarriages", "A BMI under 18.5 or over 30", "Age 35 or older"]]
        ]
    },
    {
        id: "plan-window", stage: "plan", sec: "Getting ready", icon: "📅", title: "Finding your fertile days",
        sum: "How the fertile window works and how often to try.",
        body: [
            ["p", "An egg lives for about a day, but sperm can survive up to five. That gives a fertile window of about six days each cycle, ending on the day of ovulation."],
            ["h", "When is ovulation?"],
            ["p", "About 14 days before your next period, not 14 days after the last one. With a 28-day cycle that is around day 14; with a 35-day cycle it is closer to day 21. The Track tab works this out from the periods you log."],
            ["h", "Signs from your body"],
            ["ul", ["Cervical mucus turns clear, wet and stretchy like raw egg white", "A mild ache on one side of the lower tummy", "Ovulation test strips from a pharmacy turn positive 24 to 36 hours before the egg is released"]],
            ["h", "How often"],
            ["p", "Sex every 2 to 3 days through the cycle gives the best chance and takes the pressure off timing. You do not need to save up sperm, and no position or lying still afterwards has been shown to help."],
            ["tip", "8 out of 10 couples under 35 conceive within a year of regular trying. It is normal for it to take several months."],
            ["warn", "Calendar predictions are estimates. Do not rely on them as contraception."]
        ]
    },
    {
        id: "plan-contra", stage: "plan", sec: "Family planning", icon: "🗓️", title: "Family planning and spacing",
        sum: "Contraception choices and where to get them in Sarawak.",
        body: [
            ["p", "Planning when to have a baby, and how far apart, protects the health of both mother and children. Waiting about 2 years after a birth before the next pregnancy lowers the risk of early birth and low birth weight."],
            ["h", "Methods available"],
            ["ul", [
                "Implant in the arm: lasts 3 years, over 99% effective, removable any time.",
                "IUD (coil): copper type lasts up to 10 years with no hormones; hormonal type lasts about 5.",
                "Injection: every 3 months. Periods may take some months to return after stopping.",
                "Pills: taken daily. The progestogen-only pill is suitable while breastfeeding.",
                "Condoms: the only method that also protects against infections.",
                "Permanent: tubal ligation or vasectomy, when your family is complete."
            ]],
            ["h", "Where to get them"],
            ["ul", ["Klinik Kesihatan and KKIA: family planning (perancang keluarga) is part of routine services", "Sarawak Family Planning Association clinics", "LPPKN clinic in Kuching", "Private clinics and pharmacies (pills and condoms)"]],
            ["h", "When you want to conceive"],
            ["p", "Fertility returns straight away after stopping pills, the implant or an IUD. After the injection it can take 6 to 12 months."],
            ["tip", "Emergency contraception works best within 72 hours of unprotected sex. Pharmacies and clinics can supply it."]
        ]
    },
    {
        id: "hard-when", stage: "plan", sec: "Hard to conceive", icon: "⏳", title: "When to get help",
        sum: "How long to try before seeing a doctor, and who should go sooner.",
        body: [
            ["p", "Needing help to conceive is common: about 1 in 6 couples do. It is a medical condition, not a failing, and it is never only the woman's matter."],
            ["h", "See a doctor after"],
            ["ul", ["12 months of regular unprotected sex if the woman is under 35", "6 months if she is 35 or older", "Straight away if she is 40 or older"]],
            ["h", "Go sooner if"],
            ["ul", [
                "Periods are irregular, more than 35 days apart, or absent",
                "Very painful periods or pain during sex (possible endometriosis)",
                "Known PCOS, thyroid disease, or past pelvic infection or surgery",
                "Two or more miscarriages",
                "He has had testicular surgery, injury, mumps after puberty, or trouble with erection or ejaculation",
                "Either of you has had cancer treatment"
            ]],
            ["tip", "Go together. In roughly 4 in 10 couples a male factor is involved, and a semen test is the simplest test of all."],
            ["h", "Already have a child?"],
            ["p", "Difficulty conceiving again (secondary infertility) is just as common and uses the same time limits."]
        ]
    },
    {
        id: "hard-path", stage: "plan", sec: "Hard to conceive", icon: "🧭", title: "Where to go in Sarawak",
        sum: "The step-by-step route from your local clinic to specialist care.",
        body: [
            ["ol", [
                "Start at your nearest Klinik Kesihatan, both of you. The doctor takes a history, examines you, and may order first tests. Bring your MyKads and a record of your periods (the Track tab works).",
                "Get a referral letter to the O&G specialist clinic at a government hospital. Specialist O&G services are at Sarawak General Hospital (Kuching), Sibu, Miri and Bintulu hospitals, with visiting specialists at some district hospitals.",
                "Further tests and first-line treatment, such as tablets to help ovulation, are done at the specialist clinic.",
                "For insemination (IUI) or IVF you will be referred on. The main government and LPPKN subfertility services for East Malaysia are in Kuching. Private fertility centres also operate in Kuching, and some couples travel to Kuala Lumpur or Penang."
            ]],
            ["h", "If you live outside Kuching"],
            ["ul", [
                "Ask whether blood tests, scans and semen analysis can be done at your nearest specialist hospital to reduce trips.",
                "Treatment cycles need several visits over 2 to 3 weeks. Plan leave, travel and somewhere to stay before you start.",
                "From the interior, your Klinik Desa or the mobile or flying doctor team can start the referral."
            ]],
            ["h", "Going private"],
            ["p", "You can book directly with a private O&G or fertility specialist without a referral. Waiting times are shorter and costs are higher. Ask for a written cost estimate per cycle, including medicines."],
            ["tip", "Keep one folder with every result. It saves repeat tests when you move between clinics."],
            ["warn", "Services and waiting times change. Phone ahead to confirm what each hospital currently offers."]
        ]
    },
    {
        id: "hard-tests", stage: "plan", sec: "Hard to conceive", icon: "🔬", title: "Tests and treatments explained",
        sum: "What to expect at each step, in plain words.",
        body: [
            ["h", "Tests for her"],
            ["ul", [
                "Hormone blood tests early in the cycle (day 2 to 5), and a progesterone test a week before the expected period to confirm ovulation",
                "Pelvic ultrasound to look at the womb and ovaries",
                "A tube test (HSG, an X-ray with dye) to check the fallopian tubes are open"
            ]],
            ["h", "Test for him"],
            ["p", "Semen analysis, after 2 to 7 days without ejaculation. It checks count, movement and shape. One abnormal result is usually repeated after about 3 months."],
            ["h", "Treatments, from simple to complex"],
            ["ol", [
                "Lifestyle and timing: weight, smoking, alcohol, and sex every 2 to 3 days.",
                "Ovulation induction: tablets such as letrozole or clomiphene for women who do not ovulate regularly, often with scan monitoring.",
                "Surgery where needed, for example for endometriosis, fibroids or blocked tubes.",
                "IUI: prepared sperm is placed in the womb around ovulation. Needs at least one open tube and a reasonable sperm count.",
                "IVF or ICSI: eggs are collected, fertilised in the lab and an embryo is placed in the womb. Used for blocked tubes, low sperm counts, or when other steps have not worked."
            ]],
            ["h", "PCOS"],
            ["p", "The most common cause of irregular periods. Weight loss of 5 to 10% and ovulation tablets help most women with PCOS conceive without IVF."],
            ["tip", "Age is the strongest factor in success. If you are 35 or older, ask early about the timeline for each step rather than waiting."]
        ]
    },
    {
        id: "hard-cost", stage: "plan", sec: "Hard to conceive", icon: "💰", title: "Costs and financial help",
        sum: "Government care, LPPKN's BuAI aid, EPF withdrawal and tax relief.",
        body: [
            ["h", "Government clinics and hospitals"],
            ["p", "Consultations, basic tests and ovulation tablets are heavily subsidised for Malaysians. Waiting lists for IUI and IVF can be long."],
            ["h", "BuAI (LPPKN fertility aid)"],
            ["p", "A federal programme that funds insemination (IUI) cycles for eligible lower-income married couples. LPPKN's clinic for East Malaysia is in Kuching. Income, age and other conditions apply and have changed over time, so ask LPPKN Sarawak for the current criteria."],
            ["h", "EPF (KWSP) withdrawal"],
            ["p", "Members can withdraw from Akaun Sejahtera (formerly Account 2) to pay for IUI, IVF or ICSI for themselves or their spouse. Apply through KWSP with a letter and quotation from the treating clinic."],
            ["h", "Income tax relief"],
            ["p", "Fertility treatment for you or your spouse can be claimed under medical expenses relief, within the yearly limit. Keep every official receipt."],
            ["h", "Private treatment"],
            ["p", "IUI typically costs a few thousand ringgit per cycle and IVF from the mid teens of thousands upward, plus medicines, travel and accommodation. Always ask for an itemised quote."],
            ["warn", "Most medical insurance does not cover fertility treatment. Check your policy before assuming it does."]
        ]
    },
    {
        id: "hard-him", stage: "plan", sec: "Hard to conceive", icon: "🧔", title: "It takes two: his health",
        sum: "What men can do, and why his test comes first.",
        body: [
            ["p", "Sperm take about 3 months to form, so changes made today show up in a season, not a week."],
            ["ul", [
                "Stop smoking and vaping. Both lower sperm count and damage sperm DNA.",
                "Cut down alcohol, including tuak and langkau.",
                "Keep a healthy weight and stay active.",
                "Keep the testicles cool: avoid long hot baths, tight underwear and a laptop on the lap.",
                "Avoid anabolic steroids and 'testosterone boosters'. They can switch off sperm production completely.",
                "Use protection at work against pesticides, solvents and heat.",
                "Tell the doctor about all medicines and supplements."
            ]],
            ["tip", "A semen analysis is quick, painless and cheap. Doing it early can spare your partner months of tests."]
        ]
    },
    {
        id: "hard-heart", stage: "plan", sec: "Hard to conceive", icon: "🫶", title: "Coping while you wait",
        sum: "Pressure from family, traditional remedies, and looking after each other.",
        body: [
            ["p", "Trying for a long time is exhausting, and questions at every Gawai, Raya or Chinese New Year gathering do not help. What you feel is normal."],
            ["h", "Things that help"],
            ["ul", [
                "Agree together on what you will tell family, and a short answer for 'bila lagi?'",
                "Set check-in points, for example every 3 months, to decide the next step together",
                "Keep doing things you enjoy that have nothing to do with babies",
                "Talk to someone: a counsellor, your religious leader, or a helpline"
            ]],
            ["h", "Traditional remedies"],
            ["p", "Urut, prayers and blessings are part of many families' journey and can bring comfort. Take care with:"],
            ["ul", [
                "Womb massage (urut rahim) that is deep or painful, or any massage once you might be pregnant",
                "Jamu, akar kayu and unlabelled herbal mixes. Some affect hormones or the liver, and some contain hidden steroids",
                "Anyone who asks you to stop prescribed medicine or delay seeing a doctor"
            ]],
            ["warn", "Stress does not cause infertility, and it is nobody's fault. If low mood lasts more than two weeks, ask for help."],
            ["calls"]
        ]
    },
    {
        id: "plan-loss", stage: "plan", sec: "Hard to conceive", icon: "🕊️", title: "Trying again after a miscarriage",
        sum: "What is known, and when to ask for tests.",
        body: [
            ["p", "About 1 in 5 known pregnancies ends in early miscarriage, most often from a chance chromosome problem. It was not caused by work, exercise, sex, stress or something you ate."],
            ["h", "When can we try again?"],
            ["p", "Once bleeding has stopped, you have had one normal period, and you both feel ready. There is no medical need for a long wait after an uncomplicated early miscarriage. Keep taking folic acid."],
            ["h", "Ask for a specialist review after"],
            ["ul", ["Two or more miscarriages in a row", "Any loss after 12 weeks", "A molar or ectopic pregnancy (follow the specific advice you were given)"]],
            ["tip", "If you had registered for Bantuan Ibu Bersalin and lost the pregnancy at 22 weeks or later, you may still be eligible. Ask at the welfare office or on iSarawakCare."],
            ["calls"]
        ]
    },

    // ----- Pregnancy -----
    {
        id: "preg-danger", stage: "preg", sec: "Safety", icon: "🚨", title: "Warning signs: go now", urgent: 1,
        sum: "Symptoms that need a clinic or hospital today, not tomorrow.",
        body: [
            ["warn", "Go to the nearest hospital or clinic straight away, day or night, if you have any of these. Bring your Buku Pink."],
            ["ul", [
                "Bleeding from the vagina",
                "A gush or steady leak of fluid",
                "Baby moving much less than usual, or fewer than 10 movements in 12 hours",
                "Severe headache, blurred vision or flashing lights",
                "Sudden swelling of the face, hands or feet",
                "Severe or constant tummy pain",
                "Regular contractions before 37 weeks",
                "Fever of 38°C or more",
                "Fits or fainting",
                "Vomiting so much you cannot keep fluids down",
                "Chest pain or trouble breathing",
                "Pain or burning when passing urine"
            ]],
            ["h", "If you live far from a hospital"],
            ["p", "Do not wait to see if it settles. Call your clinic nurse or 999, and start travelling. Rural clinics can arrange transfer."],
            ["calls"]
        ]
    },
    {
        id: "preg-pink", stage: "preg", sec: "Clinic care", icon: "📕", title: "Your Buku Pink and clinic visits",
        sum: "How antenatal care works at Klinik Kesihatan and what the colour codes mean.",
        body: [
            ["p", "The Buku Pink (Rekod Kesihatan Ibu) is your pregnancy record. Bring it to every visit, scan and hospital trip, including private ones."],
            ["h", "Booking"],
            ["p", "Register at your nearest Klinik Kesihatan, KKIA or Klinik Desa before 12 weeks. Care is nearly free for Malaysians. You can combine government clinic care with private scans or a private delivery."],
            ["h", "Usual visit pattern"],
            ["ul", ["Monthly until 28 weeks", "Every 2 weeks from 28 to 36 weeks", "Weekly from 36 weeks until birth", "More often if you have a risk factor"]],
            ["h", "Colour code sticker"],
            ["ul", [
                "White: low risk. Care by nurses at the clinic.",
                "Green: needs a doctor's review at the clinic.",
                "Yellow: needs specialist input; you will usually deliver in a hospital with specialists.",
                "Red: needs urgent hospital admission."
            ]],
            ["p", "The colour can change during pregnancy. It decides who sees you and where you should give birth, so ask the nurse to explain yours."],
            ["tip", "Write your questions down before each visit. Clinics are busy and it is easy to forget."]
        ]
    },
    {
        id: "preg-kicks", stage: "preg", sec: "Clinic care", icon: "👣", title: "Counting baby's kicks",
        sum: "The 10-in-12-hours chart used in the Buku Pink.",
        body: [
            ["p", "From 28 weeks, count your baby's movements every day. A baby who is well moves regularly; a change in movement can be the first sign that baby needs checking."],
            ["ol", [
                "Start at the same time each morning, for example 9am.",
                "Tap the counter each time you feel a kick, roll or push. Hiccups do not count.",
                "Stop when you reach 10. Most mothers get there well before lunchtime.",
                "Note how long it took. You will learn your baby's normal pattern."
            ]],
            ["warn", "Fewer than 10 movements in 12 hours, or a clear drop from baby's usual pattern, means go to your clinic or hospital the same day. Do not wait until tomorrow and do not rely on a home doppler."],
            ["tip", "If it feels quiet, lie on your left side and focus for a while after a meal. If you are still unsure, go in."]
        ]
    },
    {
        id: "preg-food", stage: "preg", sec: "Daily life", icon: "🥬", title: "Eating well, Sarawak style",
        sum: "Local foods that help, and what to avoid.",
        body: [
            ["h", "Good choices"],
            ["ul", [
                "Leafy greens for iron and folate: midin, cangkuk manis, daun ubi, kangkung",
                "Protein at each meal: fish, chicken, eggs (fully cooked), tempeh, tofu, beans",
                "Calcium: milk, ikan bilis eaten whole, tofu, fortified soy drink",
                "Fruit and wholegrains to ease constipation",
                "Plenty of water, more in hot weather"
            ]],
            ["h", "Avoid"],
            ["ul", [
                "Umai and other raw or half-cooked fish, meat and eggs",
                "Alcohol, including tuak, langkau, rice wine in cooking that is not boiled off, and tapai",
                "Jamu, akar kayu and herbal tonics unless your doctor agrees",
                "Large predatory fish such as shark (yu) and swordfish, which carry more mercury",
                "Unwashed ulam and food left out for hours"
            ]],
            ["h", "Go easy on"],
            ["ul", ["Coffee and tea: about 2 cups a day in total", "Sweet drinks, kuih and durian, especially if your sugar test was high", "Salted fish and instant noodles"]],
            ["tip", "Normal portions of pineapple, papaya and 'cooling' foods do not cause miscarriage. Cut what worries you, but keep variety on your plate."]
        ]
    },
    {
        id: "preg-where", stage: "preg", sec: "The birth", icon: "🏥", title: "Where to give birth",
        sum: "Government or private, and planning ahead if you live far from town.",
        body: [
            ["h", "Your options"],
            ["ul", [
                "Government hospitals: very low fees for Malaysians and full emergency cover. Wards are shared and your partner's access may be limited.",
                "Private hospitals in Kuching, Sibu, Miri and Bintulu: your own doctor and room at a much higher cost. Ask for a package price and what happens if you need a caesarean or baby needs special care.",
                "Low-risk mothers may be offered a birth at a district hospital or clinic with a birthing centre."
            ]],
            ["p", "Your Buku Pink colour code guides the safest place. Yellow and red codes should deliver at a hospital with specialists."],
            ["h", "If home is far from a hospital"],
            ["ul", [
                "Agree a plan with your clinic by 30 weeks: where, how you will travel, and how long it takes in bad weather or low river levels.",
                "Ask about staying near the hospital from about 37 to 38 weeks, with relatives or in a transit home where available.",
                "Save the clinic's phone number and keep fuel and credit topped up.",
                "First baby, twins, previous caesarean, high blood pressure or diabetes: plan to be near the hospital early."
            ]],
            ["warn", "Home birth without a trained midwife is risky. Heavy bleeding after birth can become life-threatening within minutes."]
        ]
    },
    {
        id: "preg-labour", stage: "preg", sec: "The birth", icon: "⏱️", title: "Is it labour?",
        sum: "Signs of labour and when to leave for the hospital.",
        body: [
            ["h", "Signs labour is starting"],
            ["ul", ["Contractions that get longer, stronger and closer together and do not ease with rest", "A 'show': pink or blood-streaked mucus", "Waters breaking: a gush or a steady trickle"]],
            ["h", "When to go"],
            ["ul", [
                "First baby: contractions every 5 minutes, lasting about 1 minute, for 1 hour",
                "Second or later baby: when contractions are regular, about every 10 minutes. Labour is usually faster",
                "Journey over an hour: leave as soon as contractions become regular",
                "Waters break, any bleeding, or baby moving less: go immediately, even without contractions"
            ]],
            ["tip", "Use the contraction timer in the Track tab. It works out the gap between contractions for you."],
            ["h", "Before 37 weeks"],
            ["p", "Regular tightening, backache that comes and goes, or fluid leaking is an emergency. Go straight in."]
        ]
    },
    {
        id: "preg-work", stage: "preg", sec: "Daily life", icon: "💼", title: "Your rights at work",
        sum: "Maternity and paternity leave under the Sarawak Labour Ordinance.",
        body: [
            ["p", "Sarawak's Labour Ordinance was amended with effect from 1 May 2025, bringing it in line with Peninsular Malaysia."],
            ["ul", [
                "Maternity leave: 98 consecutive days, paid, for employees in the private sector.",
                "Paternity leave: 7 consecutive days, paid, for married male employees who meet the service and notice conditions.",
                "Your employer may not dismiss you because you are pregnant or on maternity leave.",
                "Civil servants follow public service rules, which have their own leave terms."
            ]],
            ["h", "What to do"],
            ["ul", ["Tell your employer in writing, with your expected due date", "Ask HR how to apply and which documents they need", "Ask about lighter or safer duties if your work is physical or involves chemicals"]],
            ["tip", "Problems? The Department of Labour Sarawak (Jabatan Tenaga Kerja Sarawak) has offices in every division and handles complaints."]
        ]
    },
    {
        id: "preg-bugs", stage: "preg", sec: "Safety", icon: "🦟", title: "Dengue, rabies and other local risks",
        sum: "Infections to take seriously in Sarawak while pregnant.",
        body: [
            ["h", "Dengue"],
            ["p", "Use repellent, long sleeves and nets, and clear standing water around the house. Fever with body aches or a rash needs a clinic visit the same day. Take paracetamol only, not ibuprofen or aspirin."],
            ["h", "Rabies"],
            ["p", "Sarawak has had a rabies outbreak since 2017. For any bite or scratch from a dog, cat or wild animal: wash with soap and running water for 15 minutes, then go to a clinic the same day. Rabies vaccine is safe in pregnancy and must not be delayed."],
            ["h", "Malaria"],
            ["p", "Still found in some interior, forest and plantation areas. Fever after time in those areas needs a blood test straight away."],
            ["h", "Food and water"],
            ["p", "Drink boiled or treated water, especially after floods, and wash hands before meals."],
            ["warn", "Any fever in pregnancy is a reason to be seen. Do not treat it at home for more than a day."]
        ]
    },

    // ----- After birth -----
    {
        id: "post-firstweek", stage: "post", sec: "Baby", icon: "🍼", title: "Baby's first week",
        sum: "Feeding, jaundice, cord care and when to worry.",
        body: [
            ["h", "Feeding"],
            ["ul", ["8 to 12 feeds in 24 hours, including at night", "From day 5: at least 6 wet diapers a day and yellow, seedy stools", "Some weight loss in the first days is normal; most babies regain birth weight by 2 weeks"]],
            ["h", "Jaundice (kuning)"],
            ["p", "Very common between days 2 and 5. Check the skin and the whites of the eyes in daylight each day."],
            ["warn", "See a clinic the same day if yellow appears in the first 24 hours, spreads to the tummy, legs, palms or soles, or baby is very sleepy, feeding poorly, or has dark urine or pale stools."],
            ["ul", [
                "Keep feeding often. It helps clear jaundice.",
                "Putting baby in the sun is not a treatment and risks sunburn and dehydration.",
                "Do not give herbs, and keep mothballs away from baby's clothes, especially if baby has G6PD deficiency.",
                "Jaundice lasting beyond 2 weeks needs a blood test."
            ]],
            ["h", "Cord care"],
            ["p", "Keep it clean and dry and fold the diaper below it. It falls off in 1 to 2 weeks. Redness spreading on the skin, pus or a bad smell needs a clinic visit."],
            ["h", "Take baby in straight away if"],
            ["ul", ["Temperature of 37.5°C or higher, or baby feels cold", "Fast or difficult breathing, or blue lips", "Refusing feeds, floppy or hard to wake", "Fits or a high-pitched cry", "Vomiting green fluid"]],
            ["tip", "Nurses usually visit at home several times in the first weeks. Tell them where you are staying for confinement so they can find you."]
        ]
    },
    {
        id: "post-bf", stage: "post", sec: "Baby", icon: "🤱", title: "Breastfeeding basics",
        sum: "Getting a good latch and knowing baby is getting enough.",
        body: [
            ["ul", [
                "Start within the first hour if you can, with baby skin-to-skin.",
                "Tummy to tummy, nose to nipple. Wait for a wide open mouth, then bring baby to the breast.",
                "A good latch is comfortable after the first few seconds. Pain throughout means re-latch.",
                "Feed on demand. In the first weeks that is 8 to 12 times a day.",
                "Breast milk alone is all baby needs for 6 months. No water, honey or rice water."
            ]],
            ["h", "Baby is getting enough if"],
            ["ul", ["6 or more wet diapers a day after day 5", "Baby settles after most feeds", "Weight is rising at clinic checks"]],
            ["h", "Common problems"],
            ["ul", [
                "Sore nipples: almost always the latch. Ask a nurse to watch a feed.",
                "Engorgement: feed often, warm compress before and cool after.",
                "A hard, red, painful area with fever may be mastitis. Keep feeding and see a doctor."
            ]],
            ["tip", "Every Klinik Kesihatan has nurses trained in breastfeeding support. Government hospitals also run lactation clinics."]
        ]
    },
    {
        id: "post-mama", stage: "post", sec: "Mama", icon: "💗", title: "Mama's recovery",
        sum: "What is normal after birth and the signs that are not.",
        body: [
            ["h", "Normal"],
            ["ul", ["Bleeding (lochia) that lightens from red to pink to pale over 4 to 6 weeks", "After-pains, especially while breastfeeding", "Sweating, tearfulness and tiredness in the first two weeks"]],
            ["warn", "Go to hospital now for: soaking a pad in an hour or passing large clots; fever of 38°C or more; severe headache, blurred vision or fits; chest pain or breathlessness; a painful, swollen calf; or foul-smelling discharge."],
            ["h", "Looking after yourself"],
            ["ul", [
                "Rest when baby sleeps and accept help",
                "Eat a full, varied diet with plenty of fluids. Strict food restrictions slow healing",
                "Walk a little each day to prevent blood clots",
                "Keep stitches or a caesarean wound clean and dry",
                "Continue iron tablets if you were given them"
            ]],
            ["h", "Check-ups"],
            ["p", "Nurses visit at home in the first weeks, and you have a postnatal check at about 1 month. Raise anything that worries you, including mood, leaking urine or pain during sex."]
        ]
    },
    {
        id: "post-pantang", stage: "post", sec: "Mama", icon: "🌿", title: "Confinement traditions, safely",
        sum: "Iban, Malay, Chinese and Indian practices, and how to keep them safe.",
        body: [
            ["p", "Pantang traditions give a new mother rest, warmth and care. Keep what comforts you, and adjust anything that could harm you or baby."],
            ["h", "Iban and other Dayak traditions"],
            ["ul", ["Betungku (warm stone or herbal compress) and warm herbal baths", "Berdiang, sitting near a fire for warmth", "Ginger-rich dishes such as manuk pansuh and soups with lia"]],
            ["h", "Malay"],
            ["ul", ["Urut by a tukang urut, bengkung or barut binding, bertungku", "Warming foods, ikan haruan for wound healing", "Jamu and air akar kayu"]],
            ["h", "Chinese"],
            ["ul", ["A confinement lady (pui yuet) for about a month", "Kacangma (motherwort chicken), ginger, sesame oil and red date tea", "Avoiding wind and cold water"]],
            ["h", "Indian"],
            ["ul", ["Oil massage and herbal baths", "Garlic, fenugreek and omam (ajwain) water", "Rest at home for about 40 days"]],
            ["h", "Keeping it safe"],
            ["ul", [
                "Fire and smoke: never have baby in a smoky room, and keep a safe distance to avoid burns.",
                "Massage: wait until a caesarean wound has healed, and avoid deep pressure on the tummy and calves.",
                "Binding: snug, not tight. Loosen it if you feel breathless or the wound hurts.",
                "Rice wine and tuak: alcohol passes into breast milk. Boil it off well in dishes like kacangma, or leave it out.",
                "Jamu and herbs: avoid while breastfeeding, especially if baby has jaundice or G6PD deficiency.",
                "Food rules: do not cut out vegetables, fruit, fish or water. You need them to heal and make milk.",
                "Bathing: keeping clean prevents infection. Warm water is fine."
            ]],
            ["warn", "No tradition should stop you going to hospital for bleeding, fever or a sick baby."]
        ]
    },
    {
        id: "post-mood", stage: "post", sec: "Mama", icon: "🌧️", title: "Baby blues or something more?",
        sum: "How to tell the difference, and where to get help in Sarawak.",
        body: [
            ["h", "Baby blues"],
            ["p", "Tearful, irritable and overwhelmed around days 3 to 10. Very common, and it passes within two weeks with rest and support."],
            ["h", "Postnatal depression"],
            ["p", "Affects more than 1 in 10 mothers, and fathers too. Think of it if, for more than two weeks, you have:"],
            ["ul", ["Low mood or crying most days", "No interest or joy in things, including baby", "Constant worry or panic", "Trouble sleeping even when baby sleeps", "Feeling worthless or like a bad mother"]],
            ["p", "It is an illness, not weakness or lack of faith, and it gets better with treatment. Tell the nurse at your next visit or see a doctor at any Klinik Kesihatan."],
            ["warn", "Thoughts of harming yourself or your baby, hearing or seeing things, or feeling very confused is an emergency. Call 999 or go to the nearest hospital now and do not stay alone."],
            ["calls"],
            ["tip", "Partners and family: ask how she is, not only how the baby is. Take a night feed or a morning shift so she can sleep."]
        ]
    },
    {
        id: "post-admin", stage: "post", sec: "Paperwork", icon: "📝", title: "Birth certificate, EFS and BIB",
        sum: "Sarawak paperwork and state aid for your newborn, step by step.",
        body: [
            ["h", "1. Register the birth (JPN)"],
            ["ul", [
                "Where: any National Registration Department (JPN) office in Sarawak.",
                "When: as soon as you can. Within 14 days is normal registration; days 15 to 42 are delayed registration with a small fee; after 42 days it becomes late registration, which needs more documents and approval.",
                "Bring: the hospital's birth confirmation form, both parents' MyKads, marriage certificate, and the Buku Pink.",
                "Decide baby's name and spelling before you go. Corrections later are troublesome."
            ]],
            ["h", "2. Endowment Fund Sarawak (EFS)"],
            ["ul", [
                "What: RM1,000 placed in a savings account for a Sarawakian child, which can be withdrawn at age 18.",
                "Who: children with at least one parent holding Sarawak 'K' status on the MyKad.",
                "How: apply at the JPN counter when registering the birth, or online through iSarawakCare.",
                "When: within 12 months of birth."
            ]],
            ["h", "3. Bantuan Ibu Bersalin (BIB)"],
            ["ul", [
                "What: a one-off RM450 from the Sarawak Government for each delivery.",
                "Who: a Malaysian mother with 'K' status, or the wife of a 'K' status citizen, who delivered at 22 weeks or later, in or outside Sarawak.",
                "How: online through iSarawakCare (isarawakcare.sarawak.gov.my).",
                "Apply soon after the birth. Deadlines apply."
            ]],
            ["tip", "Do all three in one trip where you can. Many JPN counters handle the EFS form together with the birth certificate."],
            ["warn", "Amounts and rules can change with each state budget. Check iSarawakCare or the JPN counter for the current terms."]
        ]
    },
    {
        id: "post-vax", stage: "post", sec: "Baby", icon: "💉", title: "Vaccines in Sarawak",
        sum: "The free schedule, including the extra Japanese encephalitis jabs.",
        body: [
            ["p", "Vaccines under the National Immunisation Programme are free for Malaysian children at government clinics. The Track tab lists your baby's dates."],
            ["h", "What is different in Sarawak"],
            ["p", "Japanese encephalitis (JE) vaccine is given at 9 and 21 months. It is part of the free schedule here because the virus, spread by mosquitoes, is more common in Sarawak."],
            ["h", "Good to know"],
            ["ul", [
                "Bring baby's health record book to every visit.",
                "Mild fever, fussiness or a sore leg for a day or two is normal. Give paracetamol in the dose the nurse advises.",
                "A cold without fever is not a reason to postpone.",
                "Missed a date? Go as soon as you can. The schedule continues; it does not restart.",
                "Rotavirus, chickenpox, flu and other optional vaccines are available at private clinics."
            ]],
            ["warn", "Take baby back if there is fever above 39°C, crying that will not stop for 3 hours, a fit, or swelling of the face or trouble breathing."]
        ]
    },
    {
        id: "post-fp", stage: "post", sec: "Mama", icon: "🗓️", title: "Family planning after birth",
        sum: "When fertility returns and which methods suit breastfeeding.",
        body: [
            ["p", "You can become pregnant before your first period returns: as early as 3 weeks after birth if you are not fully breastfeeding. Spacing pregnancies about 2 years apart gives your body time to recover."],
            ["h", "Safe while breastfeeding"],
            ["ul", [
                "Implant or injection: can start soon after birth",
                "IUD: fitted within 48 hours of birth or from 4 weeks",
                "Progestogen-only pill",
                "Condoms",
                "Combined pill: not in the first 6 weeks, and usually delayed until 6 months if breastfeeding"
            ]],
            ["h", "Breastfeeding as contraception"],
            ["p", "Works only if all three are true: baby is under 6 months, your periods have not returned, and you are breastfeeding fully, day and night. Once any one changes, use another method."],
            ["tip", "Ask at your postnatal visit. Klinik Kesihatan can fit an implant or IUD on the same day."]
        ]
    },
    {
        id: "post-solids", stage: "post", sec: "Baby", icon: "🥣", title: "Starting solids at 6 months",
        sum: "First foods from the local market.",
        body: [
            ["p", "Start at around 6 months when baby can sit with support, holds the head steady and shows interest in food. Keep breastfeeding alongside."],
            ["ul", [
                "Begin with soft porridge (bubur) and add mashed vegetables, fish, chicken, egg or tofu within the first weeks",
                "Local first foods: pumpkin, sweet potato, banana, papaya, cangkuk manis and ikan bilis powder",
                "Iron-rich food every day: meat, fish, egg yolk, green leaves",
                "Offer new foods one at a time, including egg and peanut in soft form, to spot allergies",
                "No salt, sugar, soy sauce or stock cubes before 1 year, and no honey"
            ]],
            ["warn", "Avoid whole nuts, whole grapes, fish balls and hard pieces. They are choking hazards."]
        ]
    }
];
