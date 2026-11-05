const MAX_MYSQL_INT = 2147483647;

// The type check matters: a JSON body can carry an object or an array where a
// string is expected.
const isFilledString = (value, maxLength) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

const isPositiveId = (value) => /^[1-9]\d{0,9}$/.test(value) && Number(value) <= MAX_MYSQL_INT;

module.exports = { isFilledString, isPositiveId };
