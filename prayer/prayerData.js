// prayerData.js - Expanded Sacred Prayer Library & Latin Data

export const openers = {
    traditional: [
        "Almighty and Everliving God,",
        "O Lord, Holy Father, Almighty and Eternal God,",
        "We beseech Thee, O Lord,",
        "Look down, we beseech Thee, O Lord,",
        "Graciously hear us, O God our Saviour,",
        "Grant, we beseech Thee, Almighty God,",
        "O God, from whom all holy desires proceed,",
        "Almighty God, unto whom all hearts are open,",
        "Sovereign Lord, Fountain of all holiness,",
        "Most Merciful Father,"
    ],
    simple: [
        "Loving God,",
        "Lord, hear our prayer,",
        "Heavenly Father,",
        "God of all comfort,",
        "Lord Jesus,",
        "Dear Lord,",
        "Gracious God,",
        "Father of mercy,",
        "Gentle Shepherd,",
        "God of peace,"
    ],
    latin: [
        "Omnipotens sempiterne Deus,",
        "Domine, Sancte Pater, omnipotens aeterne Deus,",
        "Quaesumus, Domine Deus noster,",
        "Respice, quaesumus, Domine,",
        "Exaudi nos, Deus salutaris noster,",
        "Praesta, quaesumus, omnipotens Deus,",
        "Deus, a quo sancta desideria procedunt,",
        "Clementissime Pater,"
    ]
};

export const closers = {
    traditional: [
        "Through Christ our Lord. Amen.",
        "Who livest and reignest forever and ever. Amen.",
        "Through the same Christ our Lord. Amen.",
        "In the unity of the Holy Spirit, God, for ever and ever. Amen.",
        "Through Jesus Christ, Thy Son, our Lord. Amen.",
        "Grant this through our Lord Jesus Christ. Amen.",
        "We ask this in the name of Christ, our Saviour. Amen.",
        "Through the intercession of Mary, ever Virgin. Amen."
    ],
    simple: [
        "We ask this through Christ our Lord. Amen.",
        "In Jesus' name we pray. Amen.",
        "Amen.",
        "Hear us, Lord. Amen.",
        "Trusting in Your love. Amen.",
        "With grateful hearts, Amen.",
        "In Your holy name, Amen.",
        "We trust in You, Lord. Amen."
    ],
    latin: [
        "Per Christum Dominum nostrum. Amen.",
        "Qui vivis et regnas in saecula saeculorum. Amen.",
        "Per eundem Christum Dominum nostrum. Amen.",
        "In unitate Spiritus Sancti, Deus, per omnia saecula saeculorum. Amen.",
        "Per Dominum nostrum Jesum Christum Filium tuum. Amen."
    ]
};

export const virtues = {
    traditional: [
        "patience and fortitude",
        "humility and charity",
        "faith, hope, and love",
        "wisdom and understanding",
        "perseverance and courage",
        "temperance and prudence",
        "peace and divine consolation",
        "holy zeal and devotion"
    ],
    simple: [
        "strength and peace",
        "patience and love",
        "hope and comfort",
        "wisdom and guidance",
        "courage and faith",
        "healing and rest",
        "joy and gratitude"
    ],
    latin: [
        "fidem, spem et caritatem",
        "sapientiam et intellectum",
        "fortitudinem et patientiam",
        "humilitatem et pacem",
        "gratiam et consolationem"
    ]
};

export const prayerTemplates = {
    meals: {
        traditional: [
            "bless this food which we are about to receive, and grant that, nourished by Thy gifts, we may serve Thee more faithfully. Bestow upon us the grace of [VIRTUE]",
            "look upon this table with favor, that in breaking bread together, we may recognize Thy presence among us and be filled with [VIRTUE]",
            "sanctify this meal before us, that strengthened in body and soul, we may be ever mindful of those who hunger. Fill our hearts with [VIRTUE]",
            "we give Thee thanks for this food and for all Thy blessings. May this nourishment strengthen us in [VIRTUE]"
        ],
        simple: [
            "bless this meal and those who prepared it, filling our hearts with gratitude and [VIRTUE]",
            "thank you for this food and for the hands that made it. May it strengthen us with [VIRTUE]",
            "we are grateful for this table and those gathered around it. Grant us [VIRTUE]",
            "bless our food and our fellowship. Fill us with [VIRTUE] as we share this meal"
        ]
    },
    gatherings: {
        traditional: [
            "pour forth Thy blessing upon this assembly, that all our actions may begin from Thee and by Thee be happily ended. Grant us [VIRTUE]",
            "grant that we who are gathered in Thy name may be of one heart and one mind in Thy charity, blessed with [VIRTUE]",
            "be present in our midst as we come together, and guide our deliberations with [VIRTUE]",
            "sanctify this gathering with Thy holy presence, that all we do may glorify Thee. Bestow upon us [VIRTUE]"
        ],
        simple: [
            "be present with us as we meet, guiding our words and actions with [VIRTUE]",
            "help us to grow closer to one another and to you, blessed with [VIRTUE]",
            "bless our time together and fill our hearts with [VIRTUE]",
            "guide our conversations and decisions with [VIRTUE] and Your holy wisdom"
        ]
    },
    trials: {
        traditional: [
            "look with mercy upon Thy servant facing [USER_INTENTION], granting the grace of [VIRTUE]",
            "in this time of [USER_INTENTION], be a refuge and strength, blessing us with [VIRTUE]",
            "we lift up [USER_INTENTION] to Thy throne of grace, imploring Thee to grant [VIRTUE]",
            "comfort those who suffer [USER_INTENTION], and in Thy mercy bestow [VIRTUE]",
            "be near to those enduring [USER_INTENTION], and strengthen them with [VIRTUE]"
        ],
        simple: [
            "help us as we face [USER_INTENTION], giving us [VIRTUE]",
            "walk with us through [USER_INTENTION], granting us [VIRTUE]",
            "bring comfort to [USER_INTENTION] and fill our hearts with [VIRTUE]",
            "be with us in [USER_INTENTION] and bless us with [VIRTUE]",
            "strengthen us during [USER_INTENTION] with Your gift of [VIRTUE]"
        ]
    },
    thanksgiving: {
        traditional: [
            "we give Thee thanks and praise for [USER_INTENTION], and ask that Thou wouldst continue to bless us with [VIRTUE]",
            "accept our humble gratitude for [USER_INTENTION], and grant us ever more [VIRTUE]",
            "we magnify Thy holy name for [USER_INTENTION], beseeching Thee for continued [VIRTUE]"
        ],
        simple: [
            "thank you for [USER_INTENTION]. Help us to always remember Your gifts and live with [VIRTUE]",
            "we praise you for [USER_INTENTION] and ask for continued [VIRTUE]",
            "our hearts overflow with thanks for [USER_INTENTION]. Bless us with [VIRTUE]"
        ]
    },
    guidance: {
        traditional: [
            "illuminate our minds concerning [USER_INTENTION], that we may discern Thy holy will. Grant us [VIRTUE]",
            "guide our steps regarding [USER_INTENTION], and lead us in the path of [VIRTUE]",
            "in the matter of [USER_INTENTION], give us wisdom from above and the grace of [VIRTUE]"
        ],
        simple: [
            "show us the right path for [USER_INTENTION] and give us [VIRTUE]",
            "help us make good decisions about [USER_INTENTION] with [VIRTUE]",
            "guide us in [USER_INTENTION] and fill us with [VIRTUE]"
        ]
    },
    protection: {
        traditional: [
            "defend us from all harm and evil as we pray for [USER_INTENTION]. Enfold us with Thy protection and grant us [VIRTUE]",
            "surround Thy children with Thy holy angels concerning [USER_INTENTION], shielding us with [VIRTUE]",
            "be our fortress and shield against all dangers in [USER_INTENTION], granting us [VIRTUE]"
        ],
        simple: [
            "keep us safe in [USER_INTENTION] and protect our loved ones with [VIRTUE]",
            "guard our hearts and homes in [USER_INTENTION], giving us peace and [VIRTUE]",
            "be our protection in [USER_INTENTION] and fill us with [VIRTUE]"
        ]
    },
    healing: {
        traditional: [
            "extend Thy divine healing hand upon [USER_INTENTION], restoring health of body, mind, and spirit. Grant us [VIRTUE]",
            "O Divine Physician, bring comfort and relief to [USER_INTENTION], blessing us with [VIRTUE]",
            "look with compassion upon the sickness of [USER_INTENTION], and bestow Thy grace of [VIRTUE]"
        ],
        simple: [
            "touch and heal [USER_INTENTION], granting rest, recovery, and [VIRTUE]",
            "bring Your peace and healing to [USER_INTENTION], blessing us with [VIRTUE]",
            "we pray for complete restoration in [USER_INTENTION], filled with [VIRTUE]"
        ]
    }
};

export const staticPrayers = {
    grace: {
        title: "Grace Before Meals",
        latinTitle: "Benedic, Domine",
        text: "Bless us, O Lord, and these Thy gifts, which we are about to receive from Thy bounty, through Christ our Lord. Amen.",
        latinText: "Benedic, Domine, nos et haec tua dona, quae de tua largitate sumus sumpturi. Per Christum Dominum nostrum. Amen.",
        category: "meals"
    },
    graceAfter: {
        title: "Grace After Meals",
        latinTitle: "Agimus Tibi Gratias",
        text: "We give Thee thanks, Almighty God, for all Thy benefits, who livest and reignest, world without end. Amen. May the souls of the faithful departed, through the mercy of God, rest in peace. Amen.",
        latinText: "Agimus tibi gratias, omnipotens Deus, pro universis beneficiis tuis, qui vivis et regnas in saecula saeculorum. Amen. Fidelium animae per misericordiam Dei requiescant in pace. Amen.",
        category: "meals"
    },
    ourFather: {
        title: "Our Father (Lord's Prayer)",
        latinTitle: "Pater Noster",
        text: "Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
        latinText: "Pater noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie, et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo. Amen.",
        category: "foundation"
    },
    hailMary: {
        title: "Hail Mary",
        latinTitle: "Ave Maria",
        text: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
        latinText: "Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.",
        category: "marian"
    },
    glory: {
        title: "Glory Be",
        latinTitle: "Gloria Patri",
        text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
        latinText: "Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.",
        category: "praise"
    },
    stMichael: {
        title: "Prayer to St. Michael the Archangel",
        latinTitle: "Sancte Michael Archangele",
        text: "Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, thrust into hell Satan and all evil spirits who prowl about the world seeking the ruin of souls. Amen.",
        latinText: "Sancte Michael Archangele, defende nos in praelio; contra nequitiam et insidias diaboli esto praesidium. Imperet illi Deus, supplices deprecamur: tuque, Princeps militiae caelestis, Satanam aliosque spiritus malignos, qui ad perditionem animarum pervagantur in mundo, divina virtute in infernum detrude. Amen.",
        category: "protection"
    },
    memorare: {
        title: "The Memorare",
        latinTitle: "Memorare",
        text: "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.",
        latinText: "Memorare, O piissima Virgo Maria, a saeculo non esse auditum, quemquam ad tua currentem praesidia, tua implorantem auxilia, tua petentem suffragia, esse derelictum. Ego tali animatus confidentia, ad te, Virgo Virginum, Mater, curro, ad te venio, coram te gemens, peccator assisto. Noli, Mater Verbi, verba mea despicere; sed audi propitia et exaudi. Amen.",
        category: "marian"
    },
    animaChristi: {
        title: "Anima Christi",
        latinTitle: "Anima Christi",
        text: "Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within Thy wounds hide me. Suffer me not to be separated from Thee. From the malicious enemy defend me. In the hour of my death call me, and bid me come unto Thee, that with Thy saints I may praise Thee for ever and ever. Amen.",
        latinText: "Anima Christi, sanctifica me. Corpus Christi, salva me. Sanguis Christi, inebria me. Aqua lateris Christi, lava me. Passio Christi, conforta me. O bone Iesu, exaudi me. Intra tua vulnera absconde me. Ne permittas me separari a te. Ab hoste maligno defende me. In hora mortis meae voca me. Et iube me venire ad te, ut cum Sanctis tuis laudem te in saecula saeculorum. Amen.",
        category: "devotion"
    },
    salveRegina: {
        title: "Hail Holy Queen",
        latinTitle: "Salve Regina",
        text: "Hail, Holy Queen, Mother of Mercy, hail our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Amen.",
        latinText: "Salve, Regina, Mater misericordiae; vita, dulcedo, et spes nostra, salve. Ad te clamamus, exsules filii Hevae. Ad te suspiramus, gementes et flentes in hac lacrimarum valle. Eia ergo, advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, o pia, o dulcis Virgo Maria. Amen.",
        category: "marian"
    },
    angelGuardian: {
        title: "Guardian Angel Prayer",
        latinTitle: "Angele Dei",
        text: "Angel of God, my guardian dear, to whom God's love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.",
        latinText: "Angele Dei, qui custos es mei, me, tibi commissum pietate superna, illumina, custodi, rege et guberna. Amen.",
        category: "protection"
    },
    actContrition: {
        title: "Act of Contrition",
        latinTitle: "Actus Contritionis",
        text: "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasions of sin. Amen.",
        latinText: "Deus meus, ex toto corde me poenitet omnium meorum peccatorum, eaque detestor, quia peccando iustas poenas a te statutas promerui, sed praesertim quia offendi te, summum bonum, ac dignum qui super omnia ameris. Ideo firmiter propono, adiuvante gratia tua, de cetero me non peccaturum peccandique occasiones proximas fugiturum. Amen.",
        category: "penitential"
    },
    serenity: {
        title: "Serenity Prayer",
        latinTitle: "Oratio Serenitatis",
        text: "God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference. Amen.",
        latinText: "Deus, da mihi serenitatem accipiendi res quae mutari non possunt, fortitudinem mutandi res quae mutari possunt, et sapientiam ad internoscendum differentiam. Amen.",
        category: "trials"
    }
};

export const rosaryMysteries = {
    joyful: {
        name: "The Joyful Mysteries",
        days: "Mondays & Saturdays",
        items: [
            { num: 1, name: "The Annunciation", fruit: "Humility", scripture: "Luke 1:38" },
            { num: 2, name: "The Visitation", fruit: "Love of Neighbor", scripture: "Luke 1:41-42" },
            { num: 3, name: "The Nativity of Our Lord", fruit: "Poverty of Spirit", scripture: "Luke 2:7" },
            { num: 4, name: "The Presentation in the Temple", fruit: "Obedience", scripture: "Luke 2:22" },
            { num: 5, name: "Finding Jesus in the Temple", fruit: "Joy in Finding God", scripture: "Luke 2:46" }
        ]
    },
    luminous: {
        name: "The Luminous Mysteries",
        days: "Thursdays",
        items: [
            { num: 1, name: "The Baptism of Jesus in the Jordan", fruit: "Openness to the Holy Spirit", scripture: "Matthew 3:16-17" },
            { num: 2, name: "The Wedding at Cana", fruit: "To Jesus through Mary", scripture: "John 2:5" },
            { num: 3, name: "Proclamation of the Kingdom", fruit: "Repentance and Trust in God", scripture: "Mark 1:15" },
            { num: 4, name: "The Transfiguration", fruit: "Desire for Holiness", scripture: "Matthew 17:2" },
            { num: 5, name: "Institution of the Eucharist", fruit: "Adoration of the Eucharist", scripture: "Matthew 26:26" }
        ]
    },
    sorrowful: {
        name: "The Sorrowful Mysteries",
        days: "Tuesdays & Fridays",
        items: [
            { num: 1, name: "The Agony in the Garden", fruit: "Sorrow for Sin", scripture: "Luke 22:44" },
            { num: 2, name: "The Scourging at the Pillar", fruit: "Purity & Mortification", scripture: "Matthew 27:26" },
            { num: 3, name: "Crowning with Thorns", fruit: "Moral Courage", scripture: "Matthew 27:29" },
            { num: 4, name: "Carrying of the Cross", fruit: "Patience in Suffering", scripture: "John 19:17" },
            { num: 5, name: "The Crucifixion and Death", fruit: "Perseverance at the Cross", scripture: "Luke 23:46" }
        ]
    },
    glorious: {
        name: "The Glorious Mysteries",
        days: "Wednesdays & Sundays",
        items: [
            { num: 1, name: "The Resurrection", fruit: "Faith", scripture: "Mark 16:6" },
            { num: 2, name: "The Ascension into Heaven", fruit: "Hope", scripture: "Mark 16:19" },
            { num: 3, name: "The Descent of the Holy Spirit", fruit: "Love & Holy Wisdom", scripture: "Acts 2:4" },
            { num: 4, name: "The Assumption of Mary", fruit: "Grace of a Happy Death", scripture: "Revelation 12:1" },
            { num: 5, name: "The Coronation of Mary", fruit: "Trust in Mary's Intercession", scripture: "Revelation 12:1" }
        ]
    }
};

export const intentionPresets = [
    { label: "Peace in Family", text: "peace, unity, and love in our family" },
    { label: "Healing & Health", text: "physical and spiritual healing for those who are sick" },
    { label: "Peace of Mind", text: "freedom from anxiety, mental peace, and trust in God" },
    { label: "Holy Souls", text: "the repose of the holy souls in purgatory" },
    { label: "Guidance in Work", text: "clarity, diligence, and wisdom in my work and career" },
    { label: "Protection", text: "divine protection over our home and loved ones" },
    { label: "Thanksgiving", text: "heartfelt gratitude for answered prayers and unseen blessings" }
];

export const categoryIcons = {
    meals: "🍞",
    gatherings: "👥",
    trials: "✝️",
    thanksgiving: "🙏",
    guidance: "💡",
    protection: "🛡️",
    healing: "🕊️"
};

export const categoryDescriptions = {
    meals: "Before or after meals",
    gatherings: "Meetings & assemblies",
    trials: "Hardships & burdens",
    thanksgiving: "Gratitude & praise",
    guidance: "Seeking God's direction",
    protection: "Defense against harm",
    healing: "Physical & spiritual wellness"
};

export const inspirationQuotes = [
    { text: "Pray as though everything depended on God. Work as though everything depended on you.", author: "St. Ignatius of Loyola", latin: "Ora ac si omne a Deo penderet, labora ac si omne a te penderet." },
    { text: "Prayer is the raising of one's mind and heart to God or the requesting of good things from God.", author: "St. John Damascene", latin: "Oratio est ascensus mentis in Deum." },
    { text: "The prayer of a righteous person is powerful and effective.", author: "James 5:16", latin: "Multum enim valet deprecatio iusti assidua." },
    { text: "Be who God meant you to be and you will set the world on fire.", author: "St. Catherine of Siena", latin: "Estote quod Deus vos esse voluit et mundum incenditis." },
    { text: "Peace begins with a smile.", author: "St. Teresa of Calcutta", latin: "Pax a risu incipit." },
    { text: "Rest in Him, for He is your peace.", author: "St. Augustine", latin: "Inquietum est cor nostrum, donec requiescat in te." }
];
