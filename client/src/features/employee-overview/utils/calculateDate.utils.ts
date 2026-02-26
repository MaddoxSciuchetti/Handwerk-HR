export const dateObject = new Date(Date.now());
export const calculateData = (
  firstDate: Date,
  secondDate: Date,
  dateObject: Date
) => {
  if (firstDate && secondDate <= dateObject) {
    return false;
  } else {
    return true;
  }
};
