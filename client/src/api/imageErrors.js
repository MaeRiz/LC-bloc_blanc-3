export const ACCEPTED_IMAGES = '.jpg,.jpeg,.png,.webp';

const SIZE_MESSAGE = "L'image dépasse la taille maximale de 5 Mo.";

const API_MESSAGES = {
    'Image too large': SIZE_MESSAGE,
    'Unsupported image format': "Format d'image non accepté. Utilisez une image JPG, PNG ou WebP.",
};

// nginx answers 413 before the API when the file is far above the limit.
export const getImageError = (err, fallback) => {
    if (err.response?.status === 413) return SIZE_MESSAGE;

    return API_MESSAGES[err.response?.data?.message] ?? fallback;
};
