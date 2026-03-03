export const parseGermanDate = (germanDate: string): Date => {
    const [day, month, year] = germanDate.split(".").map(Number);
    return new Date(year, month - 1, day);
};
