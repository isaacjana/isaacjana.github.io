// massData.js - The Order of Mass (Roman Rite, Ordinary Form) with the people's parts
// in English and Latin. Speaker keys: P = Priest / reader, R = People's response, A = All together.
// Scripture of the day (the Lectionary) is linked from massEngine.js, not reproduced here.

export const massSections = {
    intro: { title: 'Introductory Rites', latin: 'Ritus Initiales', icon: '🕯️' },
    word: { title: 'Liturgy of the Word', latin: 'Liturgia Verbi', icon: '📜' },
    eucharist: { title: 'Liturgy of the Eucharist', latin: 'Liturgia Eucharistica', icon: '🍷' },
    conclusion: { title: 'Concluding Rites', latin: 'Ritus Conclusionis', icon: '🕊️' }
};

export const postures = {
    stand: { label: 'Stand', icon: '🧍' },
    sit: { label: 'Sit', icon: '🪑' },
    kneel: { label: 'Kneel', icon: '🙏' }
};

export const massParts = [
    // ---------------------------------------------------------- Introductory Rites
    {
        id: 'entrance', section: 'intro', title: 'Entrance & Greeting', latinTitle: 'Introitus', posture: 'stand',
        note: 'Stand as the priest enters. Make the Sign of the Cross together.',
        lines: [
            { w: 'P', en: 'In the name of the Father, and of the Son, and of the Holy Spirit.', la: 'In nomine Patris, et Filii, et Spiritus Sancti.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' },
            { w: 'P', en: 'The Lord be with you.', la: 'Dominus vobiscum.' },
            { w: 'R', en: 'And with your spirit.', la: 'Et cum spiritu tuo.' }
        ]
    },
    {
        id: 'penitential', section: 'intro', title: 'Penitential Act', latinTitle: 'Confiteor', posture: 'stand',
        note: 'Strike your breast at "through my fault". Other forms of the Penitential Act may be used.',
        lines: [
            { w: 'P', en: 'Brothers and sisters, let us acknowledge our sins, and so prepare ourselves to celebrate the sacred mysteries.', la: 'Fratres, agnoscamus peccata nostra, ut apti simus ad sacra mysteria celebranda.' },
            { w: 'A', en: 'I confess to almighty God and to you, my brothers and sisters, that I have greatly sinned, in my thoughts and in my words, in what I have done and in what I have failed to do, through my fault, through my fault, through my most grievous fault; therefore I ask blessed Mary ever-Virgin, all the Angels and Saints, and you, my brothers and sisters, to pray for me to the Lord our God.', la: 'Confiteor Deo omnipotenti et vobis, fratres, quia peccavi nimis cogitatione, verbo, opere et omissione: mea culpa, mea culpa, mea maxima culpa. Ideo precor beatam Mariam semper Virginem, omnes Angelos et Sanctos, et vos, fratres, orare pro me ad Dominum Deum nostrum.' },
            { w: 'P', en: 'May almighty God have mercy on us, forgive us our sins, and bring us to everlasting life.', la: 'Misereatur nostri omnipotens Deus et, dimissis peccatis nostris, perducat nos ad vitam aeternam.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' }
        ]
    },
    {
        id: 'kyrie', section: 'intro', title: 'Lord, Have Mercy', latinTitle: 'Kyrie', posture: 'stand',
        lines: [
            { w: 'P', en: 'Lord, have mercy.', la: 'Kyrie, eleison.' },
            { w: 'R', en: 'Lord, have mercy.', la: 'Kyrie, eleison.' },
            { w: 'P', en: 'Christ, have mercy.', la: 'Christe, eleison.' },
            { w: 'R', en: 'Christ, have mercy.', la: 'Christe, eleison.' },
            { w: 'P', en: 'Lord, have mercy.', la: 'Kyrie, eleison.' },
            { w: 'R', en: 'Lord, have mercy.', la: 'Kyrie, eleison.' }
        ]
    },
    {
        id: 'gloria', section: 'intro', title: 'Glory to God', latinTitle: 'Gloria', posture: 'stand', rule: 'gloria',
        note: 'Sung or said on Sundays outside Advent and Lent.',
        lines: [
            { w: 'A', en: 'Glory to God in the highest, and on earth peace to people of good will. We praise you, we bless you, we adore you, we glorify you, we give you thanks for your great glory, Lord God, heavenly King, O God, almighty Father.\n\nLord Jesus Christ, Only Begotten Son, Lord God, Lamb of God, Son of the Father, you take away the sins of the world, have mercy on us; you take away the sins of the world, receive our prayer; you are seated at the right hand of the Father, have mercy on us.\n\nFor you alone are the Holy One, you alone are the Lord, you alone are the Most High, Jesus Christ, with the Holy Spirit, in the glory of God the Father. Amen.', la: 'Gloria in excelsis Deo et in terra pax hominibus bonae voluntatis. Laudamus te, benedicimus te, adoramus te, glorificamus te, gratias agimus tibi propter magnam gloriam tuam, Domine Deus, Rex caelestis, Deus Pater omnipotens.\n\nDomine Fili unigenite, Iesu Christe, Domine Deus, Agnus Dei, Filius Patris, qui tollis peccata mundi, miserere nobis; qui tollis peccata mundi, suscipe deprecationem nostram. Qui sedes ad dexteram Patris, miserere nobis.\n\nQuoniam tu solus Sanctus, tu solus Dominus, tu solus Altissimus, Iesu Christe, cum Sancto Spiritu: in gloria Dei Patris. Amen.' }
        ]
    },
    {
        id: 'collect', section: 'intro', title: 'Opening Prayer (Collect)', latinTitle: 'Collecta', posture: 'stand',
        lines: [
            { w: 'P', en: 'Let us pray. [The priest prays the Collect of the day.]', la: 'Oremus.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' }
        ]
    },

    // ---------------------------------------------------------- Liturgy of the Word
    {
        id: 'firstReading', section: 'word', title: 'First Reading', posture: 'sit',
        note: 'Usually from the Old Testament (from the Acts of the Apostles during Easter Time).',
        lines: [
            { w: 'P', en: 'The word of the Lord.', la: 'Verbum Domini.' },
            { w: 'R', en: 'Thanks be to God.', la: 'Deo gratias.' }
        ]
    },
    {
        id: 'psalm', section: 'word', title: 'Responsorial Psalm', posture: 'sit',
        note: 'The cantor sings the verses and everyone repeats the refrain. The Psalm is itself the Word of God, prayed back to Him.'
    },
    {
        id: 'secondReading', section: 'word', title: 'Second Reading', posture: 'sit',
        note: 'Usually from the letters of the New Testament. Not read on weekdays, but always on Sundays and solemnities.',
        lines: [
            { w: 'P', en: 'The word of the Lord.', la: 'Verbum Domini.' },
            { w: 'R', en: 'Thanks be to God.', la: 'Deo gratias.' }
        ]
    },
    {
        id: 'acclamation', section: 'word', title: 'Gospel Acclamation', latinTitle: 'Alleluia', posture: 'stand', rule: 'alleluia',
        note: 'Stand to greet Christ present in His Gospel.',
        lines: [{ w: 'A', en: 'Alleluia, alleluia, alleluia!', la: 'Alleluia, alleluia, alleluia!' }],
        alt: {
            latinTitle: 'Laus tibi, Christe',
            note: 'During Lent the Alleluia is set aside and a different acclamation is sung.',
            lines: [{ w: 'A', en: 'Praise to you, Lord Jesus Christ, king of endless glory!', la: 'Laus tibi, Christe, rex aeternae gloriae.' }]
        }
    },
    {
        id: 'gospel', section: 'word', title: 'The Gospel', latinTitle: 'Evangelium', posture: 'stand',
        note: 'At the announcement, trace a small cross with your thumb on your forehead, lips and heart: may the Gospel be in my mind, on my lips, in my heart.',
        lines: [
            { w: 'P', en: 'The Lord be with you.', la: 'Dominus vobiscum.' },
            { w: 'R', en: 'And with your spirit.', la: 'Et cum spiritu tuo.' },
            { w: 'P', en: 'A reading from the holy Gospel according to N.', la: 'Lectio sancti Evangelii secundum N.' },
            { w: 'R', en: 'Glory to you, O Lord.', la: 'Gloria tibi, Domine.' },
            { w: 'P', en: '[The Gospel is proclaimed.] The Gospel of the Lord.', la: 'Verbum Domini.' },
            { w: 'R', en: 'Praise to you, Lord Jesus Christ.', la: 'Laus tibi, Christe.' }
        ]
    },
    {
        id: 'homily', section: 'word', title: 'Homily', latinTitle: 'Homilia', posture: 'sit',
        note: 'The priest or deacon opens the Scriptures for today\'s life. A moment of silence may follow; take a line to carry through the week.'
    },
    {
        id: 'creed', section: 'word', title: 'Nicene Creed', latinTitle: 'Credo', posture: 'stand',
        note: 'Bow at "and by the Holy Spirit … and became man" (genuflect on Christmas and the Annunciation).',
        lines: [
            { w: 'A', en: 'I believe in one God, the Father almighty, maker of heaven and earth, of all things visible and invisible.\n\nI believe in one Lord Jesus Christ, the Only Begotten Son of God, born of the Father before all ages. God from God, Light from Light, true God from true God, begotten, not made, consubstantial with the Father; through him all things were made. For us men and for our salvation he came down from heaven, and by the Holy Spirit was incarnate of the Virgin Mary, and became man. For our sake he was crucified under Pontius Pilate, he suffered death and was buried, and rose again on the third day in accordance with the Scriptures. He ascended into heaven and is seated at the right hand of the Father. He will come again in glory to judge the living and the dead and his kingdom will have no end.\n\nI believe in the Holy Spirit, the Lord, the giver of life, who proceeds from the Father and the Son, who with the Father and the Son is adored and glorified, who has spoken through the prophets.\n\nI believe in one, holy, catholic and apostolic Church. I confess one Baptism for the forgiveness of sins and I look forward to the resurrection of the dead and the life of the world to come. Amen.', la: 'Credo in unum Deum, Patrem omnipotentem, factorem caeli et terrae, visibilium omnium et invisibilium.\n\nEt in unum Dominum Iesum Christum, Filium Dei unigenitum, et ex Patre natum ante omnia saecula. Deum de Deo, lumen de lumine, Deum verum de Deo vero, genitum, non factum, consubstantialem Patri: per quem omnia facta sunt. Qui propter nos homines et propter nostram salutem descendit de caelis. Et incarnatus est de Spiritu Sancto ex Maria Virgine, et homo factus est. Crucifixus etiam pro nobis sub Pontio Pilato; passus et sepultus est, et resurrexit tertia die, secundum Scripturas, et ascendit in caelum, sedet ad dexteram Patris. Et iterum venturus est cum gloria, iudicare vivos et mortuos, cuius regni non erit finis.\n\nEt in Spiritum Sanctum, Dominum et vivificantem: qui ex Patre Filioque procedit. Qui cum Patre et Filio simul adoratur et conglorificatur: qui locutus est per prophetas.\n\nEt unam, sanctam, catholicam et apostolicam Ecclesiam. Confiteor unum baptisma in remissionem peccatorum. Et exspecto resurrectionem mortuorum, et vitam venturi saeculi. Amen.' }
        ]
    },
    {
        id: 'apostlesCreed', section: 'word', title: 'Apostles\' Creed (alternative)', latinTitle: 'Symbolum Apostolorum', posture: 'stand', optional: true,
        note: 'May be used in place of the Nicene Creed, especially in Lent and Easter Time, and at Masses with children.',
        lines: [
            { w: 'A', en: 'I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead.\n\nI believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.', la: 'Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae, et in Iesum Christum, Filium eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus, et sepultus, descendit ad inferos, tertia die resurrexit a mortuis, ascendit ad caelos, sedet ad dexteram Dei Patris omnipotentis, inde venturus est iudicare vivos et mortuos.\n\nCredo in Spiritum Sanctum, sanctam Ecclesiam catholicam, sanctorum communionem, remissionem peccatorum, carnis resurrectionem, et vitam aeternam. Amen.' }
        ]
    },
    {
        id: 'intercessions', section: 'word', title: 'Prayer of the Faithful', latinTitle: 'Oratio Universalis', posture: 'stand',
        note: 'We pray for the Church, the world, those in need, and the departed. Add your own intentions silently.',
        lines: [
            { w: 'P', en: '[Each petition ends:] … we pray to the Lord.', la: 'Dominum deprecemur.' },
            { w: 'R', en: 'Lord, hear our prayer.', la: 'Te rogamus, audi nos.' }
        ]
    },

    // ---------------------------------------------------------- Liturgy of the Eucharist
    {
        id: 'offertory', section: 'eucharist', title: 'Preparation of the Gifts', latinTitle: 'Offertorium', posture: 'sit',
        note: 'Sit during the collection and procession of the gifts. Stand when the priest says "Pray, brothers and sisters".',
        lines: [
            { w: 'P', en: 'Blessed are you, Lord God of all creation, for through your goodness we have received the bread we offer you: fruit of the earth and work of human hands, it will become for us the bread of life.', la: 'Benedictus es, Domine, Deus universi, quia de tua largitate accepimus panem, quem tibi offerimus, fructum terrae et operis manuum hominum, ex quo nobis fiet panis vitae.' },
            { w: 'R', en: 'Blessed be God for ever.', la: 'Benedictus Deus in saecula.' },
            { w: 'P', en: 'Pray, brothers and sisters, that my sacrifice and yours may be acceptable to God, the almighty Father.', la: 'Orate, fratres: ut meum ac vestrum sacrificium acceptabile fiat apud Deum Patrem omnipotentem.' },
            { w: 'R', en: 'May the Lord accept the sacrifice at your hands for the praise and glory of his name, for our good and the good of all his holy Church.', la: 'Suscipiat Dominus sacrificium de manibus tuis ad laudem et gloriam nominis sui, ad utilitatem quoque nostram, totiusque Ecclesiae suae sanctae.' }
        ]
    },
    {
        id: 'preface', section: 'eucharist', title: 'Preface Dialogue', latinTitle: 'Praefatio', posture: 'stand',
        lines: [
            { w: 'P', en: 'The Lord be with you.', la: 'Dominus vobiscum.' },
            { w: 'R', en: 'And with your spirit.', la: 'Et cum spiritu tuo.' },
            { w: 'P', en: 'Lift up your hearts.', la: 'Sursum corda.' },
            { w: 'R', en: 'We lift them up to the Lord.', la: 'Habemus ad Dominum.' },
            { w: 'P', en: 'Let us give thanks to the Lord our God.', la: 'Gratias agamus Domino Deo nostro.' },
            { w: 'R', en: 'It is right and just.', la: 'Dignum et iustum est.' }
        ]
    },
    {
        id: 'sanctus', section: 'eucharist', title: 'Holy, Holy, Holy', latinTitle: 'Sanctus', posture: 'stand',
        note: 'Join the angels\' song. In the USA, kneel after the Sanctus.',
        lines: [
            { w: 'A', en: 'Holy, Holy, Holy Lord God of hosts. Heaven and earth are full of your glory. Hosanna in the highest. Blessed is he who comes in the name of the Lord. Hosanna in the highest.', la: 'Sanctus, Sanctus, Sanctus Dominus Deus Sabaoth. Pleni sunt caeli et terra gloria tua. Hosanna in excelsis. Benedictus qui venit in nomine Domini. Hosanna in excelsis.' }
        ]
    },
    {
        id: 'eucharisticPrayer', section: 'eucharist', title: 'Eucharistic Prayer', latinTitle: 'Prex Eucharistica', posture: 'kneel',
        note: 'The heart of the Mass. The priest, acting in the person of Christ, prays over the bread and wine: "Take this, all of you, and eat of it, for this is my Body, which will be given up for you" … "Take this, all of you, and drink from it, for this is the chalice of my Blood". The Body, Blood, Soul and Divinity of Christ become truly present. Adore silently at the elevations.',
        lines: [
            { w: 'P', en: 'The mystery of faith.', la: 'Mysterium fidei.' },
            { w: 'A', en: 'We proclaim your Death, O Lord, and profess your Resurrection until you come again.', la: 'Mortem tuam annuntiamus, Domine, et tuam resurrectionem confitemur, donec venias.' },
            { w: 'A', en: '(or) When we eat this Bread and drink this Cup, we proclaim your Death, O Lord, until you come again.', la: 'Quotiescumque manducamus panem hunc et calicem bibimus, mortem tuam annuntiamus, Domine, donec venias.' },
            { w: 'A', en: '(or) Save us, Savior of the world, for by your Cross and Resurrection you have set us free.', la: 'Salvator mundi, salva nos, qui per crucem et resurrectionem tuam liberasti nos.' }
        ]
    },
    {
        id: 'doxology', section: 'eucharist', title: 'Doxology & Great Amen', latinTitle: 'Doxologia', posture: 'kneel',
        note: 'Sing or say the "Amen" with full voice: it is the Church\'s assent to the whole Eucharistic Prayer.',
        lines: [
            { w: 'P', en: 'Through him, and with him, and in him, O God, almighty Father, in the unity of the Holy Spirit, all glory and honor is yours, for ever and ever.', la: 'Per ipsum, et cum ipso, et in ipso, est tibi Deo Patri omnipotenti, in unitate Spiritus Sancti, omnis honor et gloria per omnia saecula saeculorum.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' }
        ]
    },

    // ---------------------------------------------------------- Communion Rite (part of the Liturgy of the Eucharist)
    {
        id: 'lordsPrayer', section: 'eucharist', title: 'The Lord\'s Prayer', latinTitle: 'Pater Noster', posture: 'stand',
        lines: [
            { w: 'P', en: 'At the Savior\'s command and formed by divine teaching, we dare to say:', la: 'Praeceptis salutaribus moniti, et divina institutione formati, audemus dicere:' },
            { w: 'A', en: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil.', la: 'Pater noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie, et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo.' },
            { w: 'P', en: 'Deliver us, Lord, we pray, from every evil, graciously grant peace in our days, that, by the help of your mercy, we may be always free from sin and safe from all distress, as we await the blessed hope and the coming of our Savior, Jesus Christ.', la: 'Libera nos, quaesumus, Domine, ab omnibus malis, da propitius pacem in diebus nostris, ut, ope misericordiae tuae adiuti, et a peccato simus semper liberi et ab omni perturbatione securi: exspectantes beatam spem et adventum Salvatoris nostri Iesu Christi.' },
            { w: 'R', en: 'For the kingdom, the power and the glory are yours now and for ever.', la: 'Quia tuum est regnum, et potestas, et gloria in saecula.' }
        ]
    },
    {
        id: 'peace', section: 'eucharist', title: 'Sign of Peace', latinTitle: 'Pax', posture: 'stand',
        note: 'Offer a handshake or nod of peace to those near you — Christ\'s peace, not just a greeting.',
        lines: [
            { w: 'P', en: 'Lord Jesus Christ, who said to your Apostles, "Peace I leave you, my peace I give you," look not on our sins, but on the faith of your Church, and graciously grant her peace and unity in accordance with your will. Who live and reign for ever and ever.', la: 'Domine Iesu Christe, qui dixisti Apostolis tuis: Pacem relinquo vobis, pacem meam do vobis: ne respicias peccata nostra, sed fidem Ecclesiae tuae; eamque secundum voluntatem tuam pacificare et coadunare digneris. Qui vivis et regnas in saecula saeculorum.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' },
            { w: 'P', en: 'The peace of the Lord be with you always.', la: 'Pax Domini sit semper vobiscum.' },
            { w: 'R', en: 'And with your spirit.', la: 'Et cum spiritu tuo.' },
            { w: 'P', en: 'Let us offer each other the sign of peace.', la: 'Offerte vobis pacem.' }
        ]
    },
    {
        id: 'lamb', section: 'eucharist', title: 'Lamb of God', latinTitle: 'Agnus Dei', posture: 'stand',
        note: 'During the breaking of the Host. Kneel after the Lamb of God unless your bishop directs otherwise.',
        lines: [
            { w: 'A', en: 'Lamb of God, you take away the sins of the world, have mercy on us.\nLamb of God, you take away the sins of the world, have mercy on us.\nLamb of God, you take away the sins of the world, grant us peace.', la: 'Agnus Dei, qui tollis peccata mundi: miserere nobis.\nAgnus Dei, qui tollis peccata mundi: miserere nobis.\nAgnus Dei, qui tollis peccata mundi: dona nobis pacem.' },
            { w: 'P', en: 'Behold the Lamb of God, behold him who takes away the sins of the world. Blessed are those called to the supper of the Lamb.', la: 'Ecce Agnus Dei, ecce qui tollit peccata mundi. Beati qui ad cenam Agni vocati sunt.' },
            { w: 'A', en: 'Lord, I am not worthy that you should enter under my roof, but only say the word and my soul shall be healed.', la: 'Domine, non sum dignus ut intres sub tectum meum, sed tantum dic verbo, et sanabitur anima mea.' }
        ]
    },
    {
        id: 'communion', section: 'eucharist', title: 'Holy Communion', latinTitle: 'Communio', posture: 'stand',
        note: 'Catholics who are properly disposed — in a state of grace, having fasted one hour — approach to receive. Bow before receiving; receive in the hand or on the tongue. Those not receiving may cross their arms over their chest to ask for a blessing. Afterwards, return and kneel or sit for silent thanksgiving.',
        lines: [
            { w: 'P', en: 'The Body of Christ.', la: 'Corpus Christi.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' },
            { w: 'P', en: 'The Blood of Christ.', la: 'Sanguis Christi.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' }
        ]
    },

    // ---------------------------------------------------------- Concluding Rites
    {
        id: 'afterCommunion', section: 'conclusion', title: 'Prayer after Communion', latinTitle: 'Post Communionem', posture: 'stand',
        lines: [
            { w: 'P', en: 'Let us pray. [The priest prays the Prayer after Communion.]', la: 'Oremus.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' }
        ]
    },
    {
        id: 'blessing', section: 'conclusion', title: 'Blessing & Dismissal', latinTitle: 'Benedictio et Dimissio', posture: 'stand',
        note: 'Sign yourself with the Cross at the blessing. The dismissal is a mission: take Christ into the world.',
        lines: [
            { w: 'P', en: 'The Lord be with you.', la: 'Dominus vobiscum.' },
            { w: 'R', en: 'And with your spirit.', la: 'Et cum spiritu tuo.' },
            { w: 'P', en: 'May almighty God bless you, the Father, and the Son, and the Holy Spirit.', la: 'Benedicat vos omnipotens Deus, Pater, et Filius, et Spiritus Sanctus.' },
            { w: 'R', en: 'Amen.', la: 'Amen.' },
            { w: 'P', en: 'Go forth, the Mass is ended. (or) Go in peace, glorifying the Lord by your life. (or) Go and announce the Gospel of the Lord. (or) Go in peace.', la: 'Ite, missa est.' },
            { w: 'R', en: 'Thanks be to God.', la: 'Deo gratias.' }
        ]
    }
];

// Quick preparation and thanksgiving prayers around Mass
export const massPrayers = {
    before: {
        title: 'A Prayer Before Mass',
        text: 'Lord Jesus, as I enter Your house, quiet my heart. Let me hear Your Word with faith, offer myself with Your sacrifice, and receive You with love. Make me a living Eucharist for those I meet this week. Amen.'
    },
    spiritual: {
        title: 'Act of Spiritual Communion',
        subtitle: 'For those unable to receive sacramentally',
        text: 'My Jesus, I believe that You are present in the Most Blessed Sacrament. I love You above all things, and I desire to receive You into my soul. Since I cannot at this moment receive You sacramentally, come at least spiritually into my heart. I embrace You as if You were already there and unite myself wholly to You. Never permit me to be separated from You. Amen.'
    },
    after: {
        title: 'Anima Christi (Thanksgiving after Communion)',
        text: 'Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within Thy wounds hide me. Suffer me not to be separated from Thee. From the malicious enemy defend me. In the hour of my death call me, and bid me come unto Thee, that with Thy saints I may praise Thee forever and ever. Amen.'
    }
};

export const massFaq = [
    { q: 'Is Sunday Mass an obligation?', a: 'Yes. Catholics are obliged to attend Mass on Sundays and holy days of obligation, unless excused by serious reason such as illness or caring for infants. A Vigil Mass on Saturday evening fulfills the Sunday obligation.' },
    { q: 'What is the Eucharistic fast?', a: 'Abstain from food and drink (other than water and medicine) for one hour before receiving Holy Communion.' },
    { q: 'Who may receive Communion?', a: 'Catholics who are not conscious of grave sin (if so, first go to Confession). Non-Catholic visitors are warmly welcome to attend and may come forward with arms crossed to receive a blessing.' },
    { q: 'What are the Holy Days of Obligation in the USA?', a: 'Solemnity of Mary, Mother of God (Jan 1); Ascension; Assumption (Aug 15); All Saints (Nov 1); Immaculate Conception (Dec 8); Christmas (Dec 25). Some are dispensed when they fall on a Saturday or Monday — check your diocese.' },
    { q: 'What is the Sunday cycle?', a: 'Sunday readings run on a three-year cycle: Year A (Matthew), Year B (Mark, with John in summer) and Year C (Luke). Weekdays use a two-year cycle (I and II).' }
];
