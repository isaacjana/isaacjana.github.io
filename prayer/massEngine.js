// massEngine.js - Liturgical calendar logic for the Sunday Mass companion.
// Follows the General Roman Calendar as celebrated in the USA
// (Epiphany, Ascension and Corpus Christi on Sundays).

const DAY_MS = 86400000;

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const weeksBetween = (from, to) => Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / (7 * DAY_MS));

function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher)
export function easterDate(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
}

// First Sunday of Advent = fourth Sunday before Christmas
export function adventStart(y) {
    const christmas = new Date(y, 11, 25);
    const fourthSunday = addDays(christmas, -(christmas.getDay() || 7));
    return addDays(fourthSunday, -21);
}

// Sunday readings cycle: the liturgical year beginning Advent of Y is A when Y % 3 === 0 (e.g. Advent 2025 -> Year A)
export function sundayCycle(date) {
    const y = date >= adventStart(date.getFullYear()) ? date.getFullYear() : date.getFullYear() - 1;
    return ['A', 'B', 'C'][y % 3];
}

export function upcomingSunday(from = new Date()) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    return addDays(d, (7 - d.getDay()) % 7);
}

export function shiftSunday(sunday, weeks) {
    return addDays(sunday, weeks * 7);
}

export function readingsUrl(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `https://bible.usccb.gov/bible/readings/${mm}${dd}${yy}.cfm`;
}

// Fixed-date feasts and solemnities that replace an Ordinary Time Sunday
const FIXED_OVERRIDES = [
    { m: 1, d: 2, name: 'Presentation of the Lord', color: 'white', gloria: true, feast: true },
    { m: 5, d: 24, name: 'Nativity of St. John the Baptist', color: 'white', gloria: true },
    { m: 5, d: 29, name: 'Sts. Peter and Paul, Apostles', color: 'red', gloria: true },
    { m: 7, d: 6, name: 'Transfiguration of the Lord', color: 'white', gloria: true },
    { m: 7, d: 15, name: 'Assumption of the Blessed Virgin Mary', color: 'white', gloria: true },
    { m: 8, d: 14, name: 'Exaltation of the Holy Cross', color: 'red', gloria: true },
    { m: 10, d: 1, name: 'All Saints', color: 'white', gloria: true },
    { m: 10, d: 2, name: 'The Commemoration of All the Faithful Departed (All Souls)', color: 'purple', gloria: false },
    { m: 10, d: 9, name: 'Dedication of the Lateran Basilica', color: 'white', gloria: true }
];
// (months above are zero-based: 1 = Feb, 5 = Jun, 6 = Jul, 7 = Aug, 8 = Sep, 10 = Nov)

function result(base) {
    return Object.assign({ gloria: true, alleluia: true, creed: 'Nicene', season: 'Ordinary Time' }, base);
}

export function getSundayInfo(sunday) {
    const y = sunday.getFullYear();
    const easter = easterDate(y);
    const ashWed = addDays(easter, -46);
    const pentecost = addDays(easter, 49);
    const adv = adventStart(y);
    const christKing = addDays(adv, -7);
    const cycle = sundayCycle(sunday);
    const month = sunday.getMonth();
    const day = sunday.getDate();

    const finish = base => Object.assign(result(base), {
        date: sunday,
        cycle,
        readingsUrl: readingsUrl(sunday)
    });

    // Advent
    if (sunday >= adv && sunday < new Date(y, 11, 25)) {
        const n = weeksBetween(adv, sunday) + 1;
        return finish({
            name: `${ordinal(n)} Sunday of Advent`,
            season: 'Advent',
            color: n === 3 ? 'rose' : 'purple',
            gloria: false,
            note: n === 3 ? 'Gaudete Sunday — rose vestments, a day of rejoicing.' : 'Gloria is omitted during Advent.'
        });
    }

    // Christmas Time (US calendar)
    if (month === 11 && day === 25) return finish({ name: 'The Nativity of the Lord (Christmas)', season: 'Christmas', color: 'white' });
    if (month === 11 && day >= 26 && day <= 31) return finish({ name: 'The Holy Family of Jesus, Mary and Joseph', season: 'Christmas', color: 'white' });
    if (month === 0 && day === 1) return finish({ name: 'Solemnity of Mary, the Holy Mother of God', season: 'Christmas', color: 'white', note: 'A holy day of obligation — falling on a Sunday it is the same Mass.' });
    if (month === 0 && day >= 2 && day <= 8) return finish({ name: 'The Epiphany of the Lord', season: 'Christmas', color: 'white' });
    if (month === 0 && day >= 9 && day <= 13 && sameDay(sunday, addDays(epiphanySunday(y), 7))) {
        return finish({ name: 'The Baptism of the Lord', season: 'Christmas', color: 'white' });
    }

    // Ordinary Time before Lent
    if (sunday < ashWed) {
        const epi = epiphanySunday(y);
        const second = epi.getDate() >= 7 ? addDays(epi, 7) : addDays(epi, 14);
        const n = 2 + weeksBetween(second, sunday);
        return ordinaryOrOverride(sunday, n, finish);
    }

    // Lent & Holy Week
    if (sunday < easter) {
        const palm = addDays(easter, -7);
        if (sameDay(sunday, palm)) {
            return finish({ name: 'Palm Sunday of the Passion of the Lord', season: 'Lent', color: 'red', gloria: false, alleluia: false, note: 'The Passion is read; Gloria is omitted.' });
        }
        const n = weeksBetween(addDays(ashWed, 4), sunday) + 1;
        return finish({
            name: `${ordinal(n)} Sunday of Lent`,
            season: 'Lent',
            color: n === 4 ? 'rose' : 'purple',
            gloria: false,
            alleluia: false,
            note: n === 4 ? 'Laetare Sunday — rose vestments, a pause for joy in Lent.' : 'Gloria and the Alleluia are omitted during Lent.'
        });
    }

    // Easter Time
    if (sunday <= pentecost) {
        const n = weeksBetween(easter, sunday) + 1;
        if (n === 1) return finish({ name: 'Easter Sunday of the Resurrection of the Lord', season: 'Easter', color: 'white', note: 'The renewal of baptismal promises may replace the Creed.' });
        if (n === 2) return finish({ name: '2nd Sunday of Easter (Sunday of Divine Mercy)', season: 'Easter', color: 'white' });
        if (n === 7 && sameDay(sunday, addDays(easter, 42))) {
            return finish({ name: 'The Ascension of the Lord / 7th Sunday of Easter', season: 'Easter', color: 'white', note: 'In most US dioceses the Ascension is celebrated on this Sunday; elsewhere it is the 7th Sunday of Easter.' });
        }
        if (sameDay(sunday, pentecost)) return finish({ name: 'Pentecost Sunday', season: 'Easter', color: 'red', note: 'The Sequence "Veni, Sancte Spiritus" is sung before the Gospel.' });
        return finish({ name: `${ordinal(n)} Sunday of Easter`, season: 'Easter', color: 'white' });
    }

    // Solemnities of the Lord after Easter Time
    if (sameDay(sunday, addDays(easter, 56))) return finish({ name: 'The Most Holy Trinity', color: 'white' });
    if (sameDay(sunday, addDays(easter, 63))) return finish({ name: 'The Most Holy Body and Blood of Christ (Corpus Christi)', color: 'white' });
    if (sameDay(sunday, christKing)) return finish({ name: 'Our Lord Jesus Christ, King of the Universe', color: 'white', note: 'The final Sunday of the liturgical year (34th Sunday in Ordinary Time).' });

    // Ordinary Time after Pentecost
    const n = 34 - weeksBetween(sunday, christKing);
    return ordinaryOrOverride(sunday, n, finish);
}

function ordinaryOrOverride(sunday, n, finish) {
    const hit = FIXED_OVERRIDES.find(o => o.m === sunday.getMonth() && o.d === sunday.getDate());
    if (hit) {
        return finish({ name: hit.name, color: hit.color, gloria: hit.gloria, season: 'Ordinary Time', note: 'This feast takes precedence over the Sunday in Ordinary Time.' });
    }
    return finish({ name: `${ordinal(n)} Sunday in Ordinary Time`, color: 'green' });
}

// US Epiphany: the Sunday falling between January 2 and 8
function epiphanySunday(y) {
    for (let d = 2; d <= 8; d++) {
        const date = new Date(y, 0, d);
        if (date.getDay() === 0) return date;
    }
}

export const colorStyles = {
    green: { label: 'Green', hex: '#2E7D32' },
    purple: { label: 'Violet', hex: '#6A3A8C' },
    rose: { label: 'Rose', hex: '#D98BA5' },
    white: { label: 'White / Gold', hex: '#E8D48A' },
    red: { label: 'Red', hex: '#B22222' }
};
