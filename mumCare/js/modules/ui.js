export const switchTab = (tabName) => {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('nav-active');
    });
    // Find the button that calls this tab and add active class
    // This is handled in the inline onclick for now but can be refined
    window.scrollTo(0, 0);
};

export const updateHeader = (user, userData) => {
    const greeting = document.getElementById('header-greeting');
    const avatar = document.getElementById('user-avatar');
    const profileImg = document.getElementById('profile-img-lg');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');

    if (greeting) greeting.innerText = `Halo, Mama ${userData.name.split(' ')[0]}`;
    if (avatar) avatar.src = userData.photoURL || 'assets/img/logo_kenyalang.png';
    if (profileImg) profileImg.src = userData.photoURL || 'assets/img/logo_kenyalang.png';
    if (profileName) profileName.innerText = userData.name;
    if (profileEmail) profileEmail.innerText = userData.email;
};

export const calculatePregnancy = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Standard pregnancy is 40 weeks (280 days).
    const daysElapsed = 280 - daysUntilDue;
    const currentWeek = Math.max(0, Math.floor(daysElapsed / 7));

    return { daysUntilDue, currentWeek };
};
