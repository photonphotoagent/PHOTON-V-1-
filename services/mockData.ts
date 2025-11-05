import { EarningsData } from '../types';

const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const photoTitles = [
    "Neon Cityscape", "Forest Sunrise", "Mountain Peak", "Ocean Waves", "Desert Dunes", "Corporate Meeting", "Coffee Shop Vibes", "City Park Bench", "Tech Startup Office", "Abstract Colors"
];

const platforms = ["Adobe Stock", "Getty Images", "Shutterstock", "Etsy"];

const generateSales = (count: number) => {
    const sales = [];
    for (let i = 0; i < count; i++) {
        const title = photoTitles[Math.floor(Math.random() * photoTitles.length)];
        sales.push({
            id: `sale_${i}`,
            photo: {
                thumbnailUrl: `https://source.unsplash.com/random/100x100/?${title.split(' ').join(',')}`,
                title: title,
            },
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            date: generateRandomDate(new Date(2024, 4, 1), new Date()).toLocaleDateString(),
            earnings: parseFloat((Math.random() * (50 - 0.5) + 0.5).toFixed(2)),
        });
    }
    return sales;
};

const recentSales = generateSales(15).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

const topPhotos = Array.from(new Set(recentSales.map(s => s.photo.title))).slice(0, 4).map((title, i) => ({
    id: `top_${i}`,
    thumbnailUrl: `https://source.unsplash.com/random/100x100/?${title.split(' ').join(',')}`,
    title: title,
    earnings: recentSales.filter(s => s.photo.title === title).reduce((acc, curr) => acc + curr.earnings, 0),
})).sort((a,b) => b.earnings - a.earnings);


const earningsOverTime = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
        date: date.toLocaleDateString(),
        amount: Math.floor(Math.random() * 250) + 50
    };
});

export const mockEarningsData: EarningsData = {
    totalEarnings: 4850.75,
    photosSold: 123,
    topPlatform: 'Adobe Stock',
    earningsOverTime: earningsOverTime,
    topPerformingPhotos: topPhotos,
    recentSales: recentSales.slice(0,5),
};
