export const getStartingEmptyDays = (year: number, month: number): string[] => {
  const firstDay = new Date(year, month - 1, 1);
  //   const lastDay = new Date(year, month, 0);
  //   const numDays = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday
  const daysArray: string[] = [];
  // Add leading empty slots
  for (let i = 1; i < startDay; i++) {
    daysArray.push("");
  }
  // Add actual days
  //   for (let i = 1; i <= numDays; i++) {
  //     daysArray.push(i.toString());
  //   }
  // Add trailing empty slots to reach exactly 35 items
  //   while (daysArray.length < 35) {
  //     daysArray.push("");
  //   }
  return daysArray;
};
// Example: Get 35-day array for March 2023
// const daysInMarch = generateMonthDays(2023, 3);
// console.log(daysInMarch);
