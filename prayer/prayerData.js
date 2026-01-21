// prayerData.js - Expanded Prayer Library

export const openers = {
    traditional: [
        "Almighty and Everliving God,",
        "O Lord, Holy Father, Almighty and Eternal God,",
        "We beseech Thee, O Lord,",
        "Look down, we beseech Thee, O Lord,",
        "Graciously hear us, O God our Saviour,",
        "Grant, we beseech Thee, Almighty God,",
        "O God, from whom all holy desires proceed,",
        "Almighty God, unto whom all hearts are open,"
    ],
    simple: [
        "Loving God,",
        "Lord, hear our prayer,",
        "Heavenly Father,",
        "God of all comfort,",
        "Lord Jesus,",
        "Dear Lord,",
        "Gracious God,",
        "Father of mercy,"
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
        "peace and consolation"
    ],
    simple: [
        "strength and peace",
        "patience and love",
        "hope and comfort",
        "wisdom and guidance",
        "courage and faith",
        "healing and rest",
        "joy and gratitude"
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
    }
};

export const staticPrayers = {
    grace: {
        title: "Grace Before Meals",
        text: "Bless us, O Lord, and these Thy gifts, which we are about to receive from Thy bounty, through Christ our Lord. Amen.",
        category: "meals"
    },
    graceAfter: {
        title: "Grace After Meals",
        text: "We give Thee thanks, Almighty God, for all Thy benefits, who livest and reignest, world without end. Amen. May the souls of the faithful departed, through the mercy of God, rest in peace. Amen.",
        category: "meals"
    },
    glory: {
        title: "Glory Be",
        text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
        category: "praise"
    },
    ourFather: {
        title: "Our Father",
        text: "Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
        category: "foundation"
    },
    hailMary: {
        title: "Hail Mary",
        text: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
        category: "marian"
    },
    memorare: {
        title: "Memorare",
        text: "Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.",
        category: "marian"
    },
    angelGuardian: {
        title: "Guardian Angel Prayer",
        text: "Angel of God, my guardian dear, to whom God's love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.",
        category: "protection"
    },
    stMichael: {
        title: "Prayer to St. Michael",
        text: "Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, thrust into hell Satan and all evil spirits who prowl about the world seeking the ruin of souls. Amen.",
        category: "protection"
    },
    actContrition: {
        title: "Act of Contrition",
        text: "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasions of sin. Amen.",
        category: "penitential"
    },
    serenity: {
        title: "Serenity Prayer",
        text: "God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference. Amen.",
        category: "trials"
    }
};

export const categoryIcons = {
    meals: "🍞",
    gatherings: "👥",
    trials: "✝️",
    thanksgiving: "🙏",
    guidance: "💡"
};

export const categoryDescriptions = {
    meals: "Before or after eating",
    gatherings: "Meetings & events",
    trials: "Difficult times",
    thanksgiving: "Gratitude & praise",
    guidance: "Seeking direction"
};
