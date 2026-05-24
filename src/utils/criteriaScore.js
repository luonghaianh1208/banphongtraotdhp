export const clampCriteriaScore = (value, maxScore) => {
    if (value === '' || value === null || value === undefined) return '';

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return '';

    const parsedMaxScore = Number(maxScore);
    const safeMaxScore = Number.isFinite(parsedMaxScore) ? parsedMaxScore : parsedValue;

    return Math.min(Math.max(parsedValue, 0), safeMaxScore);
};
